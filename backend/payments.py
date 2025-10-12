"""Payment Processing APIs - Multi-gateway payment processing"""
from fastapi import APIRouter, HTTPException, Depends, status, Request
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
import uuid
import logging

from auth import get_current_user, log_audit_event
from database import payment_transactions_collection, invoices_collection
from payment_service import payment_service, StripeGateway

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic Models
class CheckoutSessionRequest(BaseModel):
    amount: float = Field(..., description="Amount to charge", gt=0)
    currency: str = Field(default="usd", description="Currency code")
    invoice_id: Optional[str] = Field(None, description="Invoice ID if paying an invoice")
    description: Optional[str] = Field(None, description="Payment description")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class PaymentRequest(BaseModel):
    gateway_id: str = Field(..., description="Payment gateway to use")
    amount: float = Field(..., description="Amount to charge", gt=0)
    currency: str = Field(default="USD", description="Currency code")
    invoice_id: Optional[str] = Field(None, description="Invoice ID if paying invoice")
    description: Optional[str] = Field(None, description="Payment description")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class RefundRequest(BaseModel):
    payment_id: str
    amount: Optional[float] = Field(None, description="Partial refund amount")
    reason: Optional[str] = Field(None, description="Refund reason")


@router.post("/checkout/session")
async def create_checkout_session(
    request: Request,
    checkout_request: CheckoutSessionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create Stripe checkout session for payment processing
    """
    try:
        company_id = current_user["company_id"]
        user_id = current_user["_id"]
        
        # Get Stripe gateway
        stripe_gateway = payment_service.get_gateway("stripe")
        if not stripe_gateway or not isinstance(stripe_gateway, StripeGateway):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Stripe payment gateway not available"
            )
        
        # Build webhook URL
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/payments/webhook/stripe"
        
        # Initialize Stripe checkout
        stripe_gateway.initialize_checkout(webhook_url)
        
        # Build success and cancel URLs from request origin
        # Frontend will send origin via headers or in request
        origin = request.headers.get("origin") or str(request.base_url).rstrip('/')
        success_url = f"{origin}/payments/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin}/payments/cancel"
        
        # Prepare metadata
        metadata = checkout_request.metadata or {}
        metadata.update({
            "company_id": company_id,
            "user_id": user_id,
            "invoice_id": checkout_request.invoice_id or "",
            "description": checkout_request.description or "Payment"
        })
        
        # Create checkout session
        session = await stripe_gateway.create_checkout_session(
            amount=checkout_request.amount,
            currency=checkout_request.currency,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata
        )
        
        # Create payment transaction record
        payment_doc = {
            "payment_id": str(uuid.uuid4()),
            "session_id": session["session_id"],
            "company_id": company_id,
            "user_id": user_id,
            "gateway": "stripe",
            "amount": checkout_request.amount,
            "currency": checkout_request.currency,
            "status": "pending",
            "payment_status": "initiated",
            "invoice_id": checkout_request.invoice_id,
            "description": checkout_request.description,
            "metadata": metadata,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await payment_transactions_collection.insert_one(payment_doc)
        
        logger.info(f"Checkout session created: {session['session_id']} for company {company_id}")
        
        return {
            "success": True,
            "session_id": session["session_id"],
            "url": session["checkout_url"],
            "payment_id": payment_doc["payment_id"]
        }
        
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create checkout session: {str(e)}"
        )


@router.get("/checkout/status/{session_id}")
async def get_checkout_status(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get checkout session status and update payment record
    """
    try:
        company_id = current_user["company_id"]
        
        # Get payment record
        payment = await payment_transactions_collection.find_one({
            "session_id": session_id,
            "company_id": company_id
        })
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment session not found"
            )
        
        # Get Stripe gateway
        stripe_gateway = payment_service.get_gateway("stripe")
        if not stripe_gateway or not isinstance(stripe_gateway, StripeGateway):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Stripe gateway not available"
            )
        
        # Get status from Stripe
        status_response = await stripe_gateway.get_checkout_status(session_id)
        
        # Update payment record only if status changed
        current_payment_status = payment.get("payment_status", "initiated")
        new_payment_status = status_response["payment_status"]
        
        if current_payment_status != new_payment_status:
            update_data = {
                "status": status_response["status"],
                "payment_status": new_payment_status,
                "updated_at": datetime.utcnow()
            }
            
            # If payment completed, record completion time
            if new_payment_status == "paid" and current_payment_status != "paid":
                update_data["completed_at"] = datetime.utcnow()
                update_data["status"] = "completed"
                
                # Audit log
                await log_audit_event(
                    user_id=payment["user_id"],
                    company_id=company_id,
                    action="payment_completed",
                    details={
                        "payment_id": payment["payment_id"],
                        "amount": payment["amount"],
                        "currency": payment["currency"],
                        "gateway": "stripe"
                    }
                )
                
                # Update invoice if applicable
                if payment.get("invoice_id"):
                    await invoices_collection.update_one(
                        {"invoice_id": payment["invoice_id"]},
                        {
                            "$set": {
                                "payment_status": "paid",
                                "paid_at": datetime.utcnow()
                            }
                        }
                    )
            
            await payment_transactions_collection.update_one(
                {"session_id": session_id},
                {"$set": update_data}
            )
        
        return {
            "session_id": session_id,
            "payment_id": payment["payment_id"],
            "status": status_response["status"],
            "payment_status": status_response["payment_status"],
            "amount": status_response["amount"],
            "currency": status_response["currency"]
        }
        
    except Exception as e:
        logger.error(f"Error getting checkout status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get checkout status: {str(e)}"
        )


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhook events
    """
    try:
        # Get request body and signature
        body = await request.body()
        signature = request.headers.get("Stripe-Signature", "")
        
        # Get Stripe gateway
        stripe_gateway = payment_service.get_gateway("stripe")
        if not stripe_gateway or not isinstance(stripe_gateway, StripeGateway):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Stripe gateway not available"
            )
        
        # Handle webhook
        webhook_response = await stripe_gateway.handle_webhook(body, signature)
        
        # Update payment record based on webhook event
        if webhook_response["session_id"]:
            payment = await payment_transactions_collection.find_one({
                "session_id": webhook_response["session_id"]
            })
            
            if payment:
                update_data = {
                    "payment_status": webhook_response["payment_status"],
                    "webhook_event_id": webhook_response["event_id"],
                    "updated_at": datetime.utcnow()
                }
                
                if webhook_response["payment_status"] == "paid":
                    update_data["status"] = "completed"
                    update_data["completed_at"] = datetime.utcnow()
                
                await payment_transactions_collection.update_one(
                    {"session_id": webhook_response["session_id"]},
                    {"$set": update_data}
                )
        
        logger.info(f"Webhook processed: {webhook_response['event_type']}")
        
        return {"success": True, "event_id": webhook_response["event_id"]}
        
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Webhook processing failed: {str(e)}"
        )


@router.post("/process")
async def process_payment(
    payment_request: PaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Process payment through specified gateway (for mock gateways)
    """
    try:
        company_id = current_user["company_id"]
        user_id = current_user["user_id"]
        
        # Process payment
        metadata = payment_request.metadata or {}
        metadata.update({
            "company_id": company_id,
            "user_id": user_id,
            "invoice_id": payment_request.invoice_id or ""
        })
        
        result = await payment_service.process_payment(
            gateway_id=payment_request.gateway_id,
            amount=payment_request.amount,
            currency=payment_request.currency,
            metadata=metadata
        )
        
        # Store payment transaction
        payment_doc = {
            "payment_id": result["payment_id"],
            "company_id": company_id,
            "user_id": user_id,
            "gateway": payment_request.gateway_id,
            "amount": payment_request.amount,
            "currency": payment_request.currency,
            "status": result["status"],
            "invoice_id": payment_request.invoice_id,
            "description": payment_request.description,
            "metadata": metadata,
            "created_at": datetime.utcnow(),
            "completed_at": datetime.utcnow() if result["status"] == "completed" else None
        }
        
        await payment_transactions_collection.insert_one(payment_doc)
        
        # Audit log
        await log_audit_event(
            user_id=user_id,
            company_id=company_id,
            action="payment_processed",
            details={
                "payment_id": result["payment_id"],
                "amount": payment_request.amount,
                "gateway": payment_request.gateway_id
            }
        )
        
        logger.info(f"Payment processed: {result['payment_id']} via {payment_request.gateway_id}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment processing failed: {str(e)}"
        )


@router.get("/history")
async def get_payment_history(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """
    Get payment transaction history
    """
    try:
        company_id = current_user["company_id"]
        
        payments = await payment_transactions_collection.find(
            {"company_id": company_id}
        ).sort("created_at", -1).limit(limit).to_list(length=limit)
        
        for payment in payments:
            payment["_id"] = str(payment["_id"])
        
        return {"payments": payments, "count": len(payments)}
        
    except Exception as e:
        logger.error(f"Error retrieving payment history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve payment history"
        )


@router.get("/gateways")
async def get_available_gateways(current_user: dict = Depends(get_current_user)):
    """
    Get list of available payment gateways
    """
    try:
        gateways = payment_service.get_available_gateways()
        return {"gateways": gateways}
    except Exception as e:
        logger.error(f"Error getting gateways: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve payment gateways"
        )


@router.get("/payments/{payment_id}")
async def get_payment(
    payment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get payment details by ID
    """
    try:
        company_id = current_user["company_id"]
        
        payment = await payment_transactions_collection.find_one({
            "payment_id": payment_id,
            "company_id": company_id
        })
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        payment["_id"] = str(payment["_id"])
        return payment
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve payment"
        )
