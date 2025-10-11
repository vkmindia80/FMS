# Quick Security Fix Implementation Guide

**Priority:** CRITICAL  
**Timeline:** 48 hours  
**Target:** Fix vulnerabilities #1 and #2

---

## 🔴 Fix #1: JWT Secret Key Validation (2-4 hours)

### Step 1: Add Validation Function

Create `/app/backend/security_utils.py`:

```python
import os
import secrets
import logging

logger = logging.getLogger(__name__)

def validate_jwt_secret():
    """Validate JWT secret key on application startup"""
    
    jwt_secret = os.getenv("JWT_SECRET_KEY")
    
    # Check if key exists
    if not jwt_secret:
        raise ValueError(
            "JWT_SECRET_KEY environment variable must be set. "
            "Generate a secure key using: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
        )
    
    # Check minimum length
    if len(jwt_secret) < 32:
        raise ValueError(
            f"JWT_SECRET_KEY must be at least 32 characters long (current: {len(jwt_secret)}). "
            "Generate a secure key using: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
        )
    
    # Check for common weak values
    WEAK_SECRETS = [
        "secret", "password", "changeme", "development", "test",
        "your-secret-key", "your_secret_key", "mysecretkey"
    ]
    
    if jwt_secret.lower() in WEAK_SECRETS:
        raise ValueError(
            f"JWT_SECRET_KEY cannot be a common weak value. "
            "Generate a secure key using: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
        )
    
    logger.info("✅ JWT_SECRET_KEY validated successfully")
    return jwt_secret

def generate_secure_jwt_secret():
    """Generate a cryptographically secure JWT secret"""
    return secrets.token_urlsafe(32)
```

### Step 2: Update server.py

```python
# In /app/backend/server.py

from security_utils import validate_jwt_secret

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info("Starting AFMS Backend Server...")
    
    try:
        # Validate JWT secret before anything else
        validate_jwt_secret()
        
        # Create indexes
        await users_collection.create_index("email", unique=True)
        # ... rest of startup code
        
    except ValueError as e:
        logger.error(f"❌ Startup validation failed: {e}")
        raise
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")
        raise
```

### Step 3: Generate Secure Secret

**For development:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Output: abcdef123456_random_secure_string_here

# Add to backend/.env
JWT_SECRET_KEY=abcdef123456_random_secure_string_here
```

**For production:**
```bash
# Use more entropy
python -c "import secrets; print(secrets.token_urlsafe(64))"

# Store securely (e.g., AWS Secrets Manager, Azure Key Vault, etc.)
```

### Step 4: Test

```bash
# Test with no key
unset JWT_SECRET_KEY
python backend/server.py
# Should fail with clear error message

# Test with weak key
export JWT_SECRET_KEY="secret"
python backend/server.py
# Should fail with clear error message

# Test with valid key
export JWT_SECRET_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(32))')"
python backend/server.py
# Should start successfully with "✅ JWT_SECRET_KEY validated successfully"
```

---

## 🔴 Fix #2: Token Revocation System (4-6 hours)

### Option A: Redis-Based (Recommended for Production)

#### Step 1: Install Redis

```bash
# Install Redis
pip install redis

# Add to requirements.txt
echo "redis==5.0.1" >> backend/requirements.txt
```

#### Step 2: Create Token Blacklist Service

Create `/app/backend/token_blacklist.py`:

```python
import redis
import logging
from datetime import datetime
from jose import jwt
from typing import Optional
import os

logger = logging.getLogger(__name__)

class TokenBlacklist:
    """Redis-based token blacklist for JWT revocation"""
    
    def __init__(self):
        redis_host = os.getenv("REDIS_HOST", "localhost")
        redis_port = int(os.getenv("REDIS_PORT", "6379"))
        redis_db = int(os.getenv("REDIS_DB", "0"))
        redis_password = os.getenv("REDIS_PASSWORD")
        
        try:
            self.client = redis.Redis(
                host=redis_host,
                port=redis_port,
                db=redis_db,
                password=redis_password,
                decode_responses=True,
                socket_connect_timeout=5
            )
            # Test connection
            self.client.ping()
            logger.info("✅ Redis connection established")
        except redis.ConnectionError as e:
            logger.error(f"❌ Redis connection failed: {e}")
            logger.warning("Token revocation will not work without Redis")
            self.client = None
    
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
            
            # Add to blacklist with TTL
            key = f"blacklist:token:{token[-16:]}"  # Use last 16 chars as key
            self.client.setex(key, ttl, "1")
            
            logger.info(f"Token blacklisted (TTL: {ttl}s)")
            return True
            
        except jwt.JWTError as e:
            logger.error(f"Failed to decode token: {e}")
            return False
        except Exception as e:
            logger.error(f"Failed to blacklist token: {e}")
            return False
    
    def is_blacklisted(self, token: str) -> bool:
        """Check if token is blacklisted"""
        
        if not self.client:
            # If Redis unavailable, fail open (allow token)
            # In production, consider failing closed (deny token)
            return False
        
        try:
            key = f"blacklist:token:{token[-16:]}"
            return self.client.exists(key) > 0
        except Exception as e:
            logger.error(f"Failed to check blacklist: {e}")
            return False
    
    def blacklist_all_user_tokens(self, user_id: str, max_ttl: int = 604800):
        """Blacklist all tokens for a user (e.g., password change)"""
        
        if not self.client:
            return False
        
        try:
            # Add user to revocation list
            key = f"revoked:user:{user_id}"
            self.client.setex(key, max_ttl, datetime.utcnow().isoformat())
            logger.info(f"All tokens revoked for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to revoke user tokens: {e}")
            return False
    
    def is_user_revoked(self, user_id: str, token_issued_at: datetime) -> bool:
        """Check if user's tokens were globally revoked after token issue"""
        
        if not self.client:
            return False
        
        try:
            key = f"revoked:user:{user_id}"
            revoked_at_str = self.client.get(key)
            
            if not revoked_at_str:
                return False
            
            revoked_at = datetime.fromisoformat(revoked_at_str)
            return token_issued_at < revoked_at
            
        except Exception as e:
            logger.error(f"Failed to check user revocation: {e}")
            return False

# Global instance
token_blacklist = TokenBlacklist()
```

#### Step 3: Update auth.py

```python
# In /app/backend/auth.py

from token_blacklist import token_blacklist

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user with blacklist check"""
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        
        # CHECK 1: Is token blacklisted?
        if token_blacklist.is_blacklisted(token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        if payload.get("type") != "access":
            raise credentials_exception
            
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        
        # CHECK 2: Are all user's tokens revoked?
        issued_at = datetime.fromtimestamp(payload.get("iat", 0))
        if token_blacklist.is_user_revoked(user_id, issued_at):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="All user tokens have been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
    except JWTError:
        raise credentials_exception
    
    user = await users_collection.find_one({"_id": user_id})
    if user is None:
        raise credentials_exception
        
    return user

@auth_router.post("/logout")
async def logout_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: dict = Depends(get_current_user)
):
    """Logout user and revoke token"""
    
    token = credentials.credentials
    
    # Add token to blacklist
    success = token_blacklist.blacklist_token(
        token, 
        JWT_SECRET_KEY, 
        JWT_ALGORITHM
    )
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="user_logout",
        details={
            "email": current_user["email"],
            "token_revoked": success
        }
    )
    
    return {
        "message": "Successfully logged out",
        "token_revoked": success
    }

# Add new endpoint for emergency token revocation
@auth_router.post("/revoke-all-tokens")
async def revoke_all_user_tokens(current_user: dict = Depends(get_current_user)):
    """Revoke all tokens for current user (e.g., after password change)"""
    
    success = token_blacklist.blacklist_all_user_tokens(current_user["_id"])
    
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="all_tokens_revoked",
        details={"reason": "user_requested"}
    )
    
    return {
        "message": "All tokens revoked successfully",
        "success": success
    }
```

#### Step 4: Update Environment Variables

```bash
# Add to backend/.env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=  # Set if Redis has auth enabled
```

#### Step 5: Start Redis

```bash
# Install Redis server
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Start Redis
redis-server

# Or use Docker
docker run -d -p 6379:6379 redis:alpine
```

#### Step 6: Test Token Revocation

```python
# Create test file: test_token_revocation.py
import requests

BASE_URL = "http://localhost:8001"

# 1. Login
response = requests.post(f"{BASE_URL}/api/auth/login", json={
    "email": "john.doe@testcompany.com",
    "password": "testpassword123"
})
token = response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Test authenticated endpoint (should work)
response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
print(f"Before logout: {response.status_code}")  # Should be 200

# 3. Logout (revoke token)
response = requests.post(f"{BASE_URL}/api/auth/logout", headers=headers)
print(f"Logout: {response.json()}")

# 4. Try to use same token (should fail)
response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
print(f"After logout: {response.status_code}")  # Should be 401
print(f"Error: {response.json()}")  # Should say "Token has been revoked"
```

```bash
python test_token_revocation.py
```

---

### Option B: Database-Based (Simpler, No Redis Required)

If you can't use Redis immediately, implement database-based revocation:

```python
# In /app/backend/database.py
revoked_tokens_collection = database.revoked_tokens

# Create TTL index for automatic cleanup
async def create_revoked_tokens_indexes():
    await revoked_tokens_collection.create_index(
        "expires_at",
        expireAfterSeconds=0  # MongoDB will auto-delete expired docs
    )

# In auth.py
import hashlib

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    # Check if token is revoked
    revoked = await revoked_tokens_collection.find_one({
        "token_hash": token_hash,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    
    if revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked"
        )
    
    # ... rest of validation

@auth_router.post("/logout")
async def logout_user(...):
    token = credentials.credentials
    payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    await revoked_tokens_collection.insert_one({
        "token_hash": token_hash,
        "revoked_at": datetime.utcnow(),
        "expires_at": datetime.fromtimestamp(payload.get("exp")),
        "user_id": current_user["_id"]
    })
    
    return {"message": "Successfully logged out"}
```

---

## Testing Checklist

### JWT Secret Validation
- [ ] Server fails to start with no JWT_SECRET_KEY
- [ ] Server fails to start with weak JWT_SECRET_KEY
- [ ] Server starts successfully with strong JWT_SECRET_KEY
- [ ] Error messages are clear and helpful

### Token Revocation
- [ ] Logout successfully revokes token
- [ ] Revoked tokens cannot access protected endpoints
- [ ] Non-revoked tokens continue working
- [ ] Token expiry still works (auto-cleanup)
- [ ] User can login again after logout
- [ ] Revoke-all-tokens works correctly

---

## Deployment Checklist

- [ ] Generate strong JWT secret for production
- [ ] Store JWT secret securely (AWS Secrets Manager, etc.)
- [ ] Set up Redis with authentication
- [ ] Configure Redis persistence
- [ ] Add Redis to docker-compose/k8s
- [ ] Update all environment variables
- [ ] Test in staging environment
- [ ] Monitor Redis memory usage
- [ ] Set up alerts for Redis failures

---

## Monitoring

Add these metrics:
- Token revocations per day
- Failed authentication attempts with revoked tokens
- Redis connection failures
- Token blacklist size

---

## Timeline

**Day 1 (4 hours):**
- Implement JWT secret validation
- Test thoroughly
- Deploy to development

**Day 2 (6 hours):**
- Implement Redis-based token revocation
- Update all authentication flows
- Write tests

**Day 3 (2 hours):**
- End-to-end testing
- Fix any issues
- Deploy to staging

**Day 4 (1 hour):**
- Production deployment
- Monitor closely

---

## Rollback Plan

If issues arise:

1. **JWT Validation Issues:**
   - Comment out validation temporarily
   - Investigate issue
   - Fix and re-deploy

2. **Token Revocation Issues:**
   - Redis failure: System falls back gracefully (tokens stay valid)
   - Critical bug: Remove blacklist check temporarily
   - Fix issue and re-deploy

---

## Questions or Issues?

Contact development team or refer to:
- `/app/SECURITY_AUDIT_REPORT.md` - Full vulnerability details
- `/app/ROADMAP.md` - Updated roadmap with priorities
- Backend logs: `/var/log/supervisor/backend.err.log`

---

**Last Updated:** August 2025  
**Author:** Security Audit Team  
**Status:** Implementation Guide
