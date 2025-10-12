"""Accounts Receivable Management APIs"""
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import uuid
import logging

from auth import get_current_user, log_audit_event
from database import invoices_collection, payment_transactions_collection, accounts_collection

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic Models
class InvoiceLineItem(BaseModel):
    description: str
    quantity: float = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)
    amount: float
    tax_rate: Optional[float] = Field(0, ge=0, le=1)

class InvoiceCreate(BaseModel):
    customer_name: str
    customer_email: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: str = Field(..., description="Invoice date (YYYY-MM-DD)")
    due_date: str = Field(..., description="Payment due date (YYYY-MM-DD)")
    line_items: List[InvoiceLineItem]
    notes: Optional[str] = None
    terms: Optional[str] = Field("Net 30", description="Payment terms")
    tax_rate: Optional[float] = Field(0, ge=0, le=1)

class InvoiceUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    due_date: Optional[str] = None
    line_items: Optional[List[InvoiceLineItem]] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class PaymentRecord(BaseModel):
    invoice_id: str
    amount: float = Field(..., gt=0)
    payment_date: str
    payment_method: str = Field(..., description="cash, check, card, bank_transfer, other")
    reference: Optional[str] = None
    notes: Optional[str] = None


@router.post("/invoices", response_model=Dict[str, Any])
async def create_invoice(
    invoice_data: InvoiceCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new invoice for accounts receivable
    """
    try:
        company_id = current_user["company_id"]
        user_id = current_user["_id"]
        
        # Calculate totals
        subtotal = sum(item.amount for item in invoice_data.line_items)
        tax_amount = subtotal * invoice_data.tax_rate
        total_amount = subtotal + tax_amount
        
        # Generate invoice number if not provided
        if not invoice_data.invoice_number:
            # Get count of existing invoices
            count = await invoices_collection.count_documents({"company_id": company_id})
            invoice_data.invoice_number = f"INV-{count + 1:05d}"
        
        # Create invoice document
        invoice_doc = {
            "invoice_id": str(uuid.uuid4()),
            "company_id": company_id,
            "created_by": user_id,
            "invoice_number": invoice_data.invoice_number,
            "customer_name": invoice_data.customer_name,
            "customer_email": invoice_data.customer_email,
            "invoice_date": invoice_data.invoice_date,
            "due_date": invoice_data.due_date,
            "line_items": [item.dict() for item in invoice_data.line_items],
            "subtotal": subtotal,
            "tax_rate": invoice_data.tax_rate,
            "tax_amount": tax_amount,
            "total_amount": total_amount,
            "amount_paid": 0,
            "amount_due": total_amount,
            "status": "draft",
            "payment_status": "unpaid",
            "notes": invoice_data.notes,
            "terms": invoice_data.terms,
            "sent_at": None,
            "paid_at": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await invoices_collection.insert_one(invoice_doc)
        
        # Audit log
        await log_audit_event(
            user_id=user_id,
            company_id=company_id,
            action="invoice_created",
            details={
                "invoice_id": invoice_doc["invoice_id"],
                "invoice_number": invoice_doc["invoice_number"],
                "customer": invoice_data.customer_name,
                "amount": total_amount
            }
        )
        
        logger.info(f"Invoice created: {invoice_doc['invoice_number']} for company {company_id}")
        
        return {
            "success": True,
            "invoice_id": invoice_doc["invoice_id"],
            "invoice_number": invoice_doc["invoice_number"],
            "total_amount": total_amount,
            "message": "Invoice created successfully"
        }
        
    except Exception as e:
        logger.error(f"Error creating invoice: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create invoice: {str(e)}"
        )


@router.get("/invoices", response_model=List[Dict[str, Any]])
async def list_invoices(
    status_filter: Optional[str] = None,
    payment_status: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """
    List all invoices with optional filters
    """
    try:
        company_id = current_user["company_id"]
        
        query = {"company_id": company_id}
        if status_filter:
            query["status"] = status_filter
        if payment_status:
            query["payment_status"] = payment_status
        
        invoices = await invoices_collection.find(query).sort("invoice_date", -1).limit(limit).to_list(length=limit)
        
        for invoice in invoices:
            invoice["_id"] = str(invoice["_id"])
        
        return invoices
        
    except Exception as e:
        logger.error(f"Error listing invoices: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve invoices"
        )


@router.get("/invoices/{invoice_id}", response_model=Dict[str, Any])
async def get_invoice(
    invoice_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get invoice details by ID
    """
    try:
        company_id = current_user["company_id"]
        
        invoice = await invoices_collection.find_one({
            "invoice_id": invoice_id,
            "company_id": company_id
        })
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )
        
        invoice["_id"] = str(invoice["_id"])
        return invoice
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving invoice: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve invoice"
        )


@router.put("/invoices/{invoice_id}")
async def update_invoice(
    invoice_id: str,
    update_data: InvoiceUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update invoice details
    """
    try:
        company_id = current_user["company_id"]
        user_id = current_user["_id"]
        
        # Get existing invoice
        invoice = await invoices_collection.find_one({
            "invoice_id": invoice_id,
            "company_id": company_id
        })
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )
        
        # Prepare update
        update_fields = {"updated_at": datetime.utcnow()}
        
        if update_data.customer_name:
            update_fields["customer_name"] = update_data.customer_name
        if update_data.customer_email:
            update_fields["customer_email"] = update_data.customer_email
        if update_data.due_date:
            update_fields["due_date"] = update_data.due_date
        if update_data.notes:
            update_fields["notes"] = update_data.notes
        if update_data.status:
            update_fields["status"] = update_data.status
            if update_data.status == "sent":
                update_fields["sent_at"] = datetime.utcnow()
        
        # Recalculate if line items changed
        if update_data.line_items:
            subtotal = sum(item.amount for item in update_data.line_items)
            tax_amount = subtotal * invoice.get("tax_rate", 0)
            total_amount = subtotal + tax_amount
            
            update_fields["line_items"] = [item.dict() for item in update_data.line_items]
            update_fields["subtotal"] = subtotal
            update_fields["tax_amount"] = tax_amount
            update_fields["total_amount"] = total_amount
            update_fields["amount_due"] = total_amount - invoice.get("amount_paid", 0)
        
        await invoices_collection.update_one(
            {"invoice_id": invoice_id},
            {"$set": update_fields}
        )
        
        # Audit log
        await log_audit_event(
            user_id=user_id,
            company_id=company_id,
            action="invoice_updated",
            details={"invoice_id": invoice_id, "updates": list(update_fields.keys())}
        )
        
        return {"success": True, "message": "Invoice updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating invoice: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update invoice"
        )


@router.post("/invoices/{invoice_id}/send")
async def send_invoice(
    invoice_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Mark invoice as sent (would integrate with email service)
    """
    try:
        company_id = current_user["company_id"]
        user_id = current_user["user_id"]
        
        result = await invoices_collection.update_one(
            {"invoice_id": invoice_id, "company_id": company_id},
            {
                "$set": {
                    "status": "sent",
                    "sent_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )
        
        # Audit log
        await log_audit_event(
            user_id=user_id,
            company_id=company_id,
            action="invoice_sent",
            details={"invoice_id": invoice_id}
        )
        
        return {"success": True, "message": "Invoice marked as sent"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending invoice: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send invoice"
        )


@router.post("/invoices/{invoice_id}/record-payment")
async def record_payment(
    invoice_id: str,
    payment: PaymentRecord,
    current_user: dict = Depends(get_current_user)
):
    """
    Record a payment against an invoice
    """
    try:
        company_id = current_user["company_id"]
        user_id = current_user["user_id"]
        
        # Get invoice
        invoice = await invoices_collection.find_one({
            "invoice_id": invoice_id,
            "company_id": company_id
        })
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )
        
        # Calculate new amounts
        amount_paid = invoice.get("amount_paid", 0) + payment.amount
        amount_due = invoice["total_amount"] - amount_paid
        
        # Determine payment status
        if amount_due <= 0:
            payment_status = "paid"
            paid_at = datetime.utcnow()
        elif amount_paid > 0:
            payment_status = "partial"
            paid_at = None
        else:
            payment_status = "unpaid"
            paid_at = None
        
        # Update invoice
        await invoices_collection.update_one(
            {"invoice_id": invoice_id},
            {
                "$set": {
                    "amount_paid": amount_paid,
                    "amount_due": max(amount_due, 0),
                    "payment_status": payment_status,
                    "paid_at": paid_at,
                    "updated_at": datetime.utcnow()
                },
                "$push": {
                    "payment_records": {
                        "payment_id": str(uuid.uuid4()),
                        "amount": payment.amount,
                        "payment_date": payment.payment_date,
                        "payment_method": payment.payment_method,
                        "reference": payment.reference,
                        "notes": payment.notes,
                        "recorded_by": user_id,
                        "recorded_at": datetime.utcnow()
                    }
                }
            }
        )
        
        # Audit log
        await log_audit_event(
            user_id=user_id,
            company_id=company_id,
            action="invoice_payment_recorded",
            details={
                "invoice_id": invoice_id,
                "amount": payment.amount,
                "payment_method": payment.payment_method
            }
        )
        
        logger.info(f"Payment recorded for invoice {invoice_id}: {payment.amount}")
        
        return {
            "success": True,
            "amount_paid": amount_paid,
            "amount_due": max(amount_due, 0),
            "payment_status": payment_status,
            "message": "Payment recorded successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record payment"
        )


@router.get("/aging-report")
async def get_aging_report(current_user: dict = Depends(get_current_user)):
    """
    Get accounts receivable aging report
    """
    try:
        company_id = current_user["company_id"]
        
        # Get all unpaid/partial invoices
        invoices = await invoices_collection.find({
            "company_id": company_id,
            "payment_status": {"$in": ["unpaid", "partial"]}
        }).to_list(length=1000)
        
        today = datetime.utcnow().date()
        aging_buckets = {
            "current": 0,  # 0-30 days
            "30_days": 0,  # 31-60 days
            "60_days": 0,  # 61-90 days
            "90_plus": 0   # 90+ days
        }
        
        total_outstanding = 0
        
        for invoice in invoices:
            amount_due = invoice.get("amount_due", invoice["total_amount"])
            total_outstanding += amount_due
            
            # Calculate days overdue
            due_date = datetime.strptime(invoice["due_date"], "%Y-%m-%d").date()
            days_overdue = (today - due_date).days
            
            if days_overdue <= 30:
                aging_buckets["current"] += amount_due
            elif days_overdue <= 60:
                aging_buckets["30_days"] += amount_due
            elif days_overdue <= 90:
                aging_buckets["60_days"] += amount_due
            else:
                aging_buckets["90_plus"] += amount_due
        
        return {
            "total_outstanding": total_outstanding,
            "aging_buckets": aging_buckets,
            "invoice_count": len(invoices),
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating aging report: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate aging report"
        )


@router.delete("/invoices/{invoice_id}")
async def delete_invoice(
    invoice_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete (void) an invoice
    """
    try:
        company_id = current_user["company_id"]
        user_id = current_user["user_id"]
        
        # Mark as voided instead of deleting
        result = await invoices_collection.update_one(
            {"invoice_id": invoice_id, "company_id": company_id},
            {
                "$set": {
                    "status": "voided",
                    "voided_at": datetime.utcnow(),
                    "voided_by": user_id
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )
        
        # Audit log
        await log_audit_event(
            user_id=user_id,
            company_id=company_id,
            action="invoice_voided",
            details={"invoice_id": invoice_id}
        )
        
        return {"success": True, "message": "Invoice voided successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error voiding invoice: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to void invoice"
        )
