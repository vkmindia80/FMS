import time
import redis
import logging
from typing import Optional
from fastapi import Request, HTTPException, status
import os
import hashlib

logger = logging.getLogger(__name__)

class RateLimiter:
    """Redis-based rate limiter for API endpoints"""
    
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
            logger.info("✅ Redis connection established for rate limiting")
            self.enabled = True
        except redis.ConnectionError as e:
            logger.error(f"❌ Redis connection failed: {e}")
            logger.warning("⚠️  Rate limiting will be disabled without Redis")
            self.client = None
            self.enabled = False
        except Exception as e:
            logger.error(f"❌ Unexpected error connecting to Redis: {e}")
            self.client = None
            self.enabled = False
    
    def _get_client_identifier(self, request: Request) -> str:
        """Get unique identifier for the client (IP address)"""
        # Try to get real IP from various headers (for reverse proxy setups)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct client IP
        client_host = request.client.host if request.client else "unknown"
        return client_host
    
    def _get_rate_limit_key(self, identifier: str, endpoint: str) -> str:
        """Generate Redis key for rate limiting"""
        # Hash identifier for privacy
        id_hash = hashlib.sha256(identifier.encode()).hexdigest()[:16]
        return f"ratelimit:{endpoint}:{id_hash}"
    
    async def check_rate_limit(
        self,
        request: Request,
        max_requests: int = 60,
        window_seconds: int = 60,
        endpoint_name: Optional[str] = None
    ) -> None:
        """Check if request exceeds rate limit
        
        Args:
            request: FastAPI request object
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
            endpoint_name: Optional endpoint name (defaults to path)
            
        Raises:
            HTTPException: If rate limit exceeded
        """
        
        if not self.enabled or not self.client:
            # Rate limiting disabled, allow all requests
            return
        
        try:
            identifier = self._get_client_identifier(request)
            endpoint = endpoint_name or request.url.path
            key = self._get_rate_limit_key(identifier, endpoint)
            
            # Use Redis pipeline for atomic operations
            pipe = self.client.pipeline()
            pipe.incr(key)
            pipe.expire(key, window_seconds)
            results = pipe.execute()
            
            current_requests = results[0]
            
            if current_requests > max_requests:
                # Get TTL for Retry-After header
                ttl = self.client.ttl(key)
                
                logger.warning(
                    f"Rate limit exceeded for {identifier} on {endpoint}: "
                    f"{current_requests}/{max_requests} requests"
                )
                
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Try again in {ttl} seconds.",
                    headers={"Retry-After": str(ttl)}
                )
            
            # Log if approaching limit (80%)
            if current_requests > max_requests * 0.8:
                logger.info(
                    f"Client {identifier} approaching rate limit on {endpoint}: "
                    f"{current_requests}/{max_requests}"
                )
                
        except HTTPException:
            # Re-raise rate limit exceptions
            raise
        except Exception as e:
            logger.error(f"Rate limit check failed: {e}")
            # Fail open - allow request if rate limiting fails
            return
    
    def get_stats(self, identifier: Optional[str] = None) -> dict:
        """Get rate limiting statistics"""
        
        if not self.enabled or not self.client:
            return {"enabled": False}
        
        try:
            stats = {
                "enabled": True,
                "redis_available": True
            }
            
            if identifier:
                # Get stats for specific client
                keys = self.client.keys(f"ratelimit:*:{identifier}*")
                stats["client_keys"] = len(keys)
            else:
                # Get global stats
                all_keys = self.client.keys("ratelimit:*")
                stats["total_tracked_clients"] = len(all_keys)
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get rate limit stats: {e}")
            return {"enabled": False, "error": str(e)}

# Global instance
rate_limiter = RateLimiter()

# Convenience functions for common rate limits
async def rate_limit_strict(request: Request):
    """Strict rate limit: 10 requests per minute"""
    await rate_limiter.check_rate_limit(request, max_requests=10, window_seconds=60)

async def rate_limit_auth(request: Request):
    """Auth endpoints rate limit: 5 requests per minute (prevent brute force)"""
    await rate_limiter.check_rate_limit(request, max_requests=5, window_seconds=60)

async def rate_limit_normal(request: Request):
    """Normal rate limit: 60 requests per minute"""
    await rate_limiter.check_rate_limit(request, max_requests=60, window_seconds=60)

async def rate_limit_high(request: Request):
    """High rate limit: 120 requests per minute"""
    await rate_limiter.check_rate_limit(request, max_requests=120, window_seconds=60)
