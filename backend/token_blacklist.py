import redis
import logging
from datetime import datetime
from jose import jwt, JWTError
from typing import Optional
import os
import hashlib

logger = logging.getLogger(__name__)

class TokenBlacklist:
    """Redis-based token blacklist for JWT revocation"""
    
    def __init__(self):
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        
        try:
            self.client = redis.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Test connection
            self.client.ping()
            logger.info("✅ Redis connection established for token blacklist")
        except redis.ConnectionError as e:
            logger.error(f"❌ Redis connection failed: {e}")
            logger.warning("⚠️  Token revocation will not work without Redis - using fallback mode")
            self.client = None
        except Exception as e:
            logger.error(f"❌ Unexpected error connecting to Redis: {e}")
            self.client = None
    
    def _get_token_key(self, token: str) -> str:
        """Generate Redis key for token (using hash for privacy)"""
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        return f"blacklist:token:{token_hash[:32]}"
    
    def _get_user_revocation_key(self, user_id: str) -> str:
        """Generate Redis key for user-wide revocation"""
        return f"revoked:user:{user_id}"
    
    def blacklist_token(self, token: str, jwt_secret: str, algorithm: str = "HS256") -> bool:
        """Add token to blacklist with automatic expiry"""
        
        if not self.client:
            logger.warning("Redis not available, token not blacklisted")
            return False
        
        try:
            # Decode token to get expiry
            payload = jwt.decode(token, jwt_secret, algorithms=[algorithm])
            exp_timestamp = payload.get("exp")
            
            if not exp_timestamp:
                logger.error("Token has no expiry, cannot blacklist")
                return False
            
            # Calculate TTL (time until token expires)
            current_timestamp = datetime.utcnow().timestamp()
            ttl = int(exp_timestamp - current_timestamp)
            
            if ttl <= 0:
                logger.info("Token already expired, no need to blacklist")
                return True
            
            # Add to blacklist with TTL (Redis will auto-delete when token expires)
            key = self._get_token_key(token)
            self.client.setex(key, ttl, "1")
            
            logger.info(f"✅ Token blacklisted successfully (TTL: {ttl}s)")
            return True
            
        except JWTError as e:
            logger.error(f"Failed to decode token for blacklisting: {e}")
            return False
        except Exception as e:
            logger.error(f"Failed to blacklist token: {e}")
            return False
    
    def is_blacklisted(self, token: str) -> bool:
        """Check if token is blacklisted"""
        
        if not self.client:
            # If Redis unavailable, fail open (allow token) for development
            # In production, consider failing closed (deny token)
            logger.debug("Redis not available, allowing token (fail-open)")
            return False
        
        try:
            key = self._get_token_key(token)
            return self.client.exists(key) > 0
        except Exception as e:
            logger.error(f"Failed to check blacklist: {e}")
            # Fail open on error
            return False
    
    def blacklist_all_user_tokens(self, user_id: str, max_ttl: int = 604800) -> bool:
        """Blacklist all tokens for a user (e.g., password change)
        
        Args:
            user_id: User ID to revoke tokens for
            max_ttl: Maximum time to live (default: 7 days)
        """
        
        if not self.client:
            logger.warning("Redis not available, cannot revoke user tokens")
            return False
        
        try:
            # Add user to revocation list with timestamp
            key = self._get_user_revocation_key(user_id)
            self.client.setex(key, max_ttl, datetime.utcnow().isoformat())
            logger.info(f"✅ All tokens revoked for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to revoke user tokens: {e}")
            return False
    
    def is_user_revoked(self, user_id: str, token_issued_at: datetime) -> bool:
        """Check if user's tokens were globally revoked after token issue"""
        
        if not self.client:
            return False
        
        try:
            key = self._get_user_revocation_key(user_id)
            revoked_at_str = self.client.get(key)
            
            if not revoked_at_str:
                return False
            
            revoked_at = datetime.fromisoformat(revoked_at_str)
            return token_issued_at < revoked_at
            
        except Exception as e:
            logger.error(f"Failed to check user revocation: {e}")
            return False
    
    def clear_user_revocation(self, user_id: str) -> bool:
        """Clear user-wide token revocation (e.g., after new login)"""
        
        if not self.client:
            return False
        
        try:
            key = self._get_user_revocation_key(user_id)
            self.client.delete(key)
            logger.info(f"✅ User revocation cleared for {user_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to clear user revocation: {e}")
            return False
    
    def get_stats(self) -> dict:
        """Get blacklist statistics"""
        
        if not self.client:
            return {"redis_available": False}
        
        try:
            # Count blacklisted tokens
            token_keys = self.client.keys("blacklist:token:*")
            user_revocation_keys = self.client.keys("revoked:user:*")
            
            return {
                "redis_available": True,
                "blacklisted_tokens": len(token_keys),
                "revoked_users": len(user_revocation_keys),
                "redis_info": {
                    "used_memory": self.client.info().get("used_memory_human"),
                    "connected_clients": self.client.info().get("connected_clients")
                }
            }
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {"redis_available": False, "error": str(e)}

# Global instance
token_blacklist = TokenBlacklist()
