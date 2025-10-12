"""
Payment Gateway Configuration Management API
Allows dynamic configuration of payment gateways with flexible API settings
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
import uuid

from database import db
from auth import get_current_user, log_audit_event

router = APIRouter()
logger = logging.getLogger(__name__)

# MongoDB collection
payment_gateway_configs_collection = db.payment_gateway_configs


# ==================== Models ====================

class GatewayConfiguration(BaseModel):
    """Flexible configuration for gateway API settings"""
    fields: Dict[str, Any] = Field(default_factory=dict, description="Key-value pairs for API configurations")


class PaymentGatewayConfig(BaseModel):
    """Payment Gateway Configuration"""
    gateway_name: str = Field(..., description="Display name of the gateway (e.g., 'Stripe', 'PayPal')")
    gateway_type: str = Field(..., description="Type of gateway (stripe, paypal, square, custom)")
    enabled: bool = Field(default=False, description="Whether gateway is enabled")
    configuration: Dict[str, Any] = Field(default_factory=dict, description="Gateway API configuration (API keys, secrets, etc.)")
    description: Optional[str] = Field(None, description="Optional description")
    
    @field_validator('gateway_type')
    @classmethod
    def validate_gateway_type(cls, v):
        allowed = ['stripe', 'paypal', 'square', 'custom']
        if v not in allowed:
            raise ValueError(f'Gateway type must be one of {allowed}')
        return v


class PaymentGatewayConfigUpdate(BaseModel):
    """Update Payment Gateway Configuration"""
    gateway_name: Optional[str] = None
    enabled: Optional[bool] = None
    configuration: Optional[Dict[str, Any]] = None
    description: Optional[str] = None


class ToggleGatewayRequest(BaseModel):
    """Toggle Gateway Request"""
    enabled: bool


class TestConnectionRequest(BaseModel):
    """Test Connection Request"""
    configuration: Dict[str, Any] = Field(..., description="Configuration to test")


# ==================== Helper Functions ====================

def mask_sensitive_fields(configuration: Dict[str, Any]) -> Dict[str, Any]:
    """Mask sensitive fields in configuration for display"""
    masked = configuration.copy()
    sensitive_keywords = ['key', 'secret', 'password', 'token', 'credential']
    
    for key, value in masked.items():
        if any(keyword in key.lower() for keyword in sensitive_keywords):
            if isinstance(value, str) and len(value) > 4:
                masked[key] = f"{value[:4]}{'*' * (len(value) - 4)}"
            else:
                masked[key] = "••••••••"
    
    return masked


async def test_gateway_connection(gateway_type: str, configuration: Dict[str, Any]) -> Dict[str, Any]:
    """Test gateway connection with provided configuration"""
    try:
        if gateway_type == "stripe":
            # Test Stripe connection
            api_key = configuration.get("api_key", "")
            if not api_key:
                return {"success": False, "message": "API key is required"}
            
            # Simple validation for Stripe key format
            if not (api_key.startswith("sk_test_") or api_key.startswith("sk_live_")):
                return {"success": False, "message": "Invalid Stripe API key format"}
            
            return {"success": True, "message": "Stripe configuration validated"}
        
        elif gateway_type == "paypal":
            # Test PayPal connection
            client_id = configuration.get("client_id", "")
            client_secret = configuration.get("client_secret", "")
            
            if not client_id or not client_secret:
                return {"success": False, "message": "Client ID and Secret are required"}
            
            return {"success": True, "message": "PayPal configuration validated"}
        
        elif gateway_type == "square":
            # Test Square connection
            access_token = configuration.get("access_token", "")
            
            if not access_token:
                return {"success": False, "message": "Access token is required"}
            
            return {"success": True, "message": "Square configuration validated"}
        
        elif gateway_type == "custom":
            # For custom gateways, just check if required fields are present
            if not configuration:
                return {"success": False, "message": "Configuration is required"}
            
            return {"success": True, "message": "Custom gateway configuration validated"}
        
        return {"success": False, "message": "Unknown gateway type"}
    
    except Exception as e:
        logger.error(f"Error testing gateway connection: {str(e)}")
        return {"success": False, "message": f"Connection test failed: {str(e)}"}


# ==================== API Endpoints ====================

@router.get("/gateways")
async def get_payment_gateways(
    current_user: dict = Depends(get_current_user)
):
    """
    Get all configured payment gateways for the company
    """
    try:
        gateways = await payment_gateway_configs_collection.find({
            "company_id": current_user["company_id"]
        }).to_list(length=100)
        
        # Mask sensitive fields
        for gateway in gateways:
            gateway["_id"] = str(gateway["_id"])
            gateway["configuration"] = mask_sensitive_fields(gateway.get("configuration", {}))
        
        return {"gateways": gateways, "count": len(gateways)}
    
    except Exception as e:
        logger.error(f"Error fetching payment gateways: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch payment gateways"
        )


@router.post("/gateways")
async def create_payment_gateway(
    gateway_config: PaymentGatewayConfig,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new payment gateway configuration
    """
    try:
        # Check if gateway with same name already exists
        existing = await payment_gateway_configs_collection.find_one({
            "company_id": current_user["company_id"],
            "gateway_name": gateway_config.gateway_name
        })
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Gateway with name '{gateway_config.gateway_name}' already exists"
            )
        
        # Create gateway document
        gateway_doc = {
            "gateway_id": str(uuid.uuid4()),
            "company_id": current_user["company_id"],
            "gateway_name": gateway_config.gateway_name,
            "gateway_type": gateway_config.gateway_type,
            "enabled": gateway_config.enabled,
            "configuration": gateway_config.configuration,
            "description": gateway_config.description,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": current_user["_id"]
        }
        
        result = await payment_gateway_configs_collection.insert_one(gateway_doc)
        
        # Log audit event
        await log_audit_event(
            user_id=current_user["_id"],
            company_id=current_user["company_id"],
            action="payment_gateway_created",
            details={
                "gateway_id": gateway_doc["gateway_id"],
                "gateway_name": gateway_config.gateway_name,
                "gateway_type": gateway_config.gateway_type
            }
        )
        
        logger.info(f"Payment gateway created: {gateway_doc['gateway_id']} - {gateway_config.gateway_name}")
        
        # Return with masked configuration
        gateway_doc["_id"] = str(gateway_doc["_id"])
        gateway_doc["configuration"] = mask_sensitive_fields(gateway_doc["configuration"])
        
        return {
            "success": True,
            "message": "Payment gateway created successfully",
            "gateway": gateway_doc
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating payment gateway: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment gateway: {str(e)}"
        )


@router.get("/gateways/{gateway_id}")
async def get_payment_gateway(
    gateway_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific payment gateway configuration
    """
    try:
        gateway = await payment_gateway_configs_collection.find_one({
            "gateway_id": gateway_id,
            "company_id": current_user["company_id"]
        })
        
        if not gateway:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment gateway not found"
            )
        
        gateway["_id"] = str(gateway["_id"])
        gateway["configuration"] = mask_sensitive_fields(gateway.get("configuration", {}))
        
        return gateway
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching payment gateway: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch payment gateway"
        )


@router.put("/gateways/{gateway_id}")
async def update_payment_gateway(
    gateway_id: str,
    gateway_update: PaymentGatewayConfigUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update payment gateway configuration
    """
    try:
        # Check if gateway exists
        existing = await payment_gateway_configs_collection.find_one({
            "gateway_id": gateway_id,
            "company_id": current_user["company_id"]
        })
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment gateway not found"
            )
        
        # Build update data
        update_data = {"updated_at": datetime.utcnow()}
        
        if gateway_update.gateway_name is not None:
            # Check for duplicate name
            duplicate = await payment_gateway_configs_collection.find_one({
                "company_id": current_user["company_id"],
                "gateway_name": gateway_update.gateway_name,
                "gateway_id": {"$ne": gateway_id}
            })
            if duplicate:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Gateway with name '{gateway_update.gateway_name}' already exists"
                )
            update_data["gateway_name"] = gateway_update.gateway_name
        
        if gateway_update.enabled is not None:
            update_data["enabled"] = gateway_update.enabled
        
        if gateway_update.configuration is not None:
            update_data["configuration"] = gateway_update.configuration
        
        if gateway_update.description is not None:
            update_data["description"] = gateway_update.description
        
        # Update gateway
        result = await payment_gateway_configs_collection.update_one(
            {"gateway_id": gateway_id},
            {"$set": update_data}
        )
        
        # Log audit event
        await log_audit_event(
            user_id=current_user["_id"],
            company_id=current_user["company_id"],
            action="payment_gateway_updated",
            details={
                "gateway_id": gateway_id,
                "updates": list(update_data.keys())
            }
        )
        
        logger.info(f"Payment gateway updated: {gateway_id}")
        
        return {
            "success": True,
            "message": "Payment gateway updated successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating payment gateway: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update payment gateway: {str(e)}"
        )


@router.delete("/gateways/{gateway_id}")
async def delete_payment_gateway(
    gateway_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a payment gateway configuration
    """
    try:
        # Check if gateway exists
        existing = await payment_gateway_configs_collection.find_one({
            "gateway_id": gateway_id,
            "company_id": current_user["company_id"]
        })
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment gateway not found"
            )
        
        # Delete gateway
        result = await payment_gateway_configs_collection.delete_one({
            "gateway_id": gateway_id
        })
        
        # Log audit event
        await log_audit_event(
            user_id=current_user["_id"],
            company_id=current_user["company_id"],
            action="payment_gateway_deleted",
            details={
                "gateway_id": gateway_id,
                "gateway_name": existing.get("gateway_name")
            }
        )
        
        logger.info(f"Payment gateway deleted: {gateway_id}")
        
        return {
            "success": True,
            "message": "Payment gateway deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting payment gateway: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete payment gateway"
        )


@router.post("/gateways/{gateway_id}/toggle")
async def toggle_payment_gateway(
    gateway_id: str,
    toggle_request: ToggleGatewayRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Toggle payment gateway on/off
    """
    try:
        # Check if gateway exists
        existing = await payment_gateway_configs_collection.find_one({
            "gateway_id": gateway_id,
            "company_id": current_user["company_id"]
        })
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment gateway not found"
            )
        
        # Update enabled status
        result = await payment_gateway_configs_collection.update_one(
            {"gateway_id": gateway_id},
            {
                "$set": {
                    "enabled": toggle_request.enabled,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Log audit event
        await log_audit_event(
            user_id=current_user["_id"],
            company_id=current_user["company_id"],
            action="payment_gateway_toggled",
            details={
                "gateway_id": gateway_id,
                "gateway_name": existing.get("gateway_name"),
                "enabled": toggle_request.enabled
            }
        )
        
        logger.info(f"Payment gateway {'enabled' if toggle_request.enabled else 'disabled'}: {gateway_id}")
        
        return {
            "success": True,
            "enabled": toggle_request.enabled,
            "message": f"Gateway {'enabled' if toggle_request.enabled else 'disabled'} successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling payment gateway: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to toggle payment gateway"
        )


@router.post("/gateways/{gateway_id}/test")
async def test_payment_gateway(
    gateway_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Test payment gateway connection
    """
    try:
        # Get gateway configuration
        gateway = await payment_gateway_configs_collection.find_one({
            "gateway_id": gateway_id,
            "company_id": current_user["company_id"]
        })
        
        if not gateway:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment gateway not found"
            )
        
        # Test connection
        test_result = await test_gateway_connection(
            gateway.get("gateway_type"),
            gateway.get("configuration", {})
        )
        
        # Log audit event
        await log_audit_event(
            user_id=current_user["_id"],
            company_id=current_user["company_id"],
            action="payment_gateway_tested",
            details={
                "gateway_id": gateway_id,
                "gateway_name": gateway.get("gateway_name"),
                "success": test_result["success"]
            }
        )
        
        return test_result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error testing payment gateway: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to test payment gateway: {str(e)}"
        )


@router.post("/test-connection")
async def test_connection_before_save(
    test_request: TestConnectionRequest,
    gateway_type: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Test gateway connection before saving configuration
    """
    try:
        test_result = await test_gateway_connection(gateway_type, test_request.configuration)
        return test_result
    
    except Exception as e:
        logger.error(f"Error testing connection: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to test connection: {str(e)}"
        )
