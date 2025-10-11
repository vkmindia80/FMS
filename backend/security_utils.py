import os
import secrets
import logging
import re
from typing import Optional

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
        "your-secret-key", "your_secret_key", "mysecretkey", "secretkey"
    ]
    
    if jwt_secret.lower() in WEAK_SECRETS or jwt_secret.lower().startswith("your-secret-key"):
        raise ValueError(
            f"JWT_SECRET_KEY cannot be a common weak value. "
            "Generate a secure key using: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
        )
    
    logger.info("✅ JWT_SECRET_KEY validated successfully")
    return jwt_secret

def generate_secure_jwt_secret():
    """Generate a cryptographically secure JWT secret"""
    return secrets.token_urlsafe(64)

def validate_password_strength(password: str) -> tuple[bool, Optional[str]]:
    """Validate password meets security requirements
    
    Returns:
        tuple: (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if len(password) > 128:
        return False, "Password must be less than 128 characters"
    
    # Check for at least one uppercase letter
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    # Check for at least one lowercase letter
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    # Check for at least one digit
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    # Check for at least one special character
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)"
    
    return True, None

def validate_emergent_llm_key():
    """Validate EMERGENT_LLM_KEY if provided"""
    
    llm_key = os.getenv("EMERGENT_LLM_KEY")
    
    if not llm_key:
        logger.warning("⚠️  EMERGENT_LLM_KEY not set - AI document processing will be disabled")
        return None
    
    # Basic validation - should start with 'sk-emergent-'
    if not llm_key.startswith("sk-emergent-"):
        logger.warning("⚠️  EMERGENT_LLM_KEY format appears invalid - expected format: sk-emergent-xxx")
        return llm_key
    
    if len(llm_key) < 20:
        logger.warning("⚠️  EMERGENT_LLM_KEY appears too short - may be invalid")
        return llm_key
    
    logger.info("✅ EMERGENT_LLM_KEY validated successfully")
    return llm_key
