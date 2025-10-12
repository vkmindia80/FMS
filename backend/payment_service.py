"""Payment Gateway Integration Service - Multi-gateway support"""
import os
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
import uuid
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class PaymentGateway:
    """Base class for payment gateway integrations"""
    
    def __init__(self, gateway_name: str, api_key: Optional[str] = None):
        self.gateway_name = gateway_name
        self.api_key = api_key
        self.enabled = bool(api_key)
    
    async def process_payment(self, amount: float, currency: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Process a payment - to be implemented by subclasses"""
        raise NotImplementedError
    
    async def refund_payment(self, payment_id: str, amount: Optional[float] = None) -> Dict[str, Any]:
        """Refund a payment"""
        raise NotImplementedError
    
    async def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """Get payment status"""
        raise NotImplementedError


class StripeGateway(PaymentGateway):
    """Stripe payment gateway integration using emergentintegrations"""
    
    def __init__(self):
        api_key = os.getenv("STRIPE_API_KEY", "sk_test_emergent")
        super().__init__("stripe", api_key)
        self.stripe_checkout = None
        logger.info(f"Stripe gateway initialized with API key: {api_key[:20]}...")
    
    def initialize_checkout(self, webhook_url: str):
        """Initialize Stripe checkout with webhook URL"""
        try:
            from emergentintegrations.payments.stripe.checkout import StripeCheckout
            self.stripe_checkout = StripeCheckout(
                api_key=self.api_key,
                webhook_url=webhook_url
            )
            logger.info(f"Stripe checkout initialized with webhook: {webhook_url}")
        except Exception as e:
            logger.error(f"Failed to initialize Stripe checkout: {str(e)}")
            raise
    
    async def create_checkout_session(
        self,
        amount: float,
        currency: str,
        success_url: str,
        cancel_url: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create Stripe checkout session"""
        try:
            from emergentintegrations.payments.stripe.checkout import CheckoutSessionRequest
            
            if not self.stripe_checkout:
                raise Exception("Stripe checkout not initialized")
            
            # Create checkout request
            checkout_request = CheckoutSessionRequest(
                amount=float(amount),  # Ensure float format
                currency=currency.lower(),
                success_url=success_url,
                cancel_url=cancel_url,
                metadata=metadata
            )
            
            # Create session
            session = await self.stripe_checkout.create_checkout_session(checkout_request)
            
            return {
                "success": True,
                "session_id": session.session_id,
                "checkout_url": session.url,
                "gateway": "stripe"
            }
            
        except Exception as e:
            logger.error(f"Error creating Stripe checkout session: {str(e)}")
            raise
    
    async def get_checkout_status(self, session_id: str) -> Dict[str, Any]:
        """Get Stripe checkout session status"""
        try:
            if not self.stripe_checkout:
                raise Exception("Stripe checkout not initialized")
            
            status_response = await self.stripe_checkout.get_checkout_status(session_id)
            
            return {
                "session_id": session_id,
                "status": status_response.status,
                "payment_status": status_response.payment_status,
                "amount": status_response.amount_total / 100,  # Convert from cents
                "currency": status_response.currency,
                "metadata": status_response.metadata
            }
            
        except Exception as e:
            logger.error(f"Error getting Stripe checkout status: {str(e)}")
            raise
    
    async def handle_webhook(self, body: bytes, signature: str) -> Dict[str, Any]:
        """Handle Stripe webhook"""
        try:
            if not self.stripe_checkout:
                raise Exception("Stripe checkout not initialized")
            
            webhook_response = await self.stripe_checkout.handle_webhook(body, signature)
            
            return {
                "event_type": webhook_response.event_type,
                "event_id": webhook_response.event_id,
                "session_id": webhook_response.session_id,
                "payment_status": webhook_response.payment_status,
                "metadata": webhook_response.metadata
            }
            
        except Exception as e:
            logger.error(f"Error handling Stripe webhook: {str(e)}")
            raise


class MockPaymentGateway(PaymentGateway):
    """Mock payment gateway for testing and demo"""
    
    def __init__(self, gateway_name: str = "mock"):
        super().__init__(gateway_name, "mock_key")
        self.payments = {}  # In-memory storage for demo
    
    async def process_payment(self, amount: float, currency: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Mock payment processing"""
        payment_id = f"pay_{uuid.uuid4()}"
        
        # Simulate payment
        self.payments[payment_id] = {
            "payment_id": payment_id,
            "amount": amount,
            "currency": currency,
            "status": "completed",
            "gateway": self.gateway_name,
            "metadata": metadata,
            "processed_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Mock payment processed: {payment_id} for {amount} {currency}")
        
        return {
            "success": True,
            "payment_id": payment_id,
            "status": "completed",
            "message": f"Mock payment processed via {self.gateway_name}"
        }
    
    async def refund_payment(self, payment_id: str, amount: Optional[float] = None) -> Dict[str, Any]:
        """Mock refund"""
        if payment_id not in self.payments:
            raise Exception("Payment not found")
        
        refund_amount = amount or self.payments[payment_id]["amount"]
        refund_id = f"ref_{uuid.uuid4()}"
        
        return {
            "success": True,
            "refund_id": refund_id,
            "amount": refund_amount,
            "status": "refunded",
            "message": "Mock refund processed"
        }
    
    async def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """Mock payment status"""
        if payment_id in self.payments:
            return self.payments[payment_id]
        
        return {
            "payment_id": payment_id,
            "status": "not_found",
            "message": "Payment not found"
        }


class PaymentService:
    """Multi-gateway payment service"""
    
    def __init__(self):
        self.gateways: Dict[str, PaymentGateway] = {}
        self._initialize_gateways()
    
    def _initialize_gateways(self):
        """Initialize available payment gateways"""
        # Stripe
        try:
            stripe_gateway = StripeGateway()
            if stripe_gateway.enabled:
                self.gateways["stripe"] = stripe_gateway
                logger.info("Stripe gateway registered")
        except Exception as e:
            logger.warning(f"Stripe gateway not available: {str(e)}")
        
        # Mock gateways for demo
        self.gateways["mock_paypal"] = MockPaymentGateway("PayPal")
        self.gateways["mock_square"] = MockPaymentGateway("Square")
        
        logger.info(f"Payment service initialized with {len(self.gateways)} gateways")
    
    def get_available_gateways(self) -> List[Dict[str, Any]]:
        """Get list of available payment gateways"""
        return [
            {
                "gateway_id": gateway_id,
                "gateway_name": gateway.gateway_name,
                "enabled": gateway.enabled
            }
            for gateway_id, gateway in self.gateways.items()
        ]
    
    def get_gateway(self, gateway_id: str) -> Optional[PaymentGateway]:
        """Get a specific payment gateway"""
        return self.gateways.get(gateway_id)
    
    async def process_payment(
        self,
        gateway_id: str,
        amount: float,
        currency: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process payment through specified gateway"""
        gateway = self.get_gateway(gateway_id)
        if not gateway:
            raise Exception(f"Gateway {gateway_id} not available")
        
        return await gateway.process_payment(amount, currency, metadata)


# Singleton instance
payment_service = PaymentService()
