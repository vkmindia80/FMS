from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import os
import aiofiles
import uuid
from enum import Enum
import mimetypes
from server import database, documents_collection
from auth import get_current_user, log_audit_event
import logging

logger = logging.getLogger(__name__)

documents_router = APIRouter()

class DocumentType(str, Enum):
    BANK_STATEMENT = "bank_statement"
    CREDIT_CARD_STATEMENT = "credit_card_statement"
    RECEIPT = "receipt"
    INVOICE = "invoice"
    PAYROLL_STUB = "payroll_stub"
    VENDOR_STATEMENT = "vendor_statement"
    TAX_DOCUMENT = "tax_document"
    OTHER = "other"

class ProcessingStatus(str, Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REVIEW_REQUIRED = "review_required"

class DocumentResponse(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_size: int
    file_type: str
    document_type: DocumentType
    processing_status: ProcessingStatus
    upload_date: datetime
    processed_date: Optional[datetime]
    extracted_data: Optional[Dict[str, Any]]
    confidence_score: Optional[float]
    error_message: Optional[str]
    tags: List[str]

class DocumentUpdate(BaseModel):
    document_type: Optional[DocumentType] = None
    tags: Optional[List[str]] = None
    extracted_data: Optional[Dict[str, Any]] = None

# Configuration
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "50000000"))  # 50MB
ALLOWED_EXTENSIONS = os.getenv("ALLOWED_EXTENSIONS", "pdf,csv,xlsx,xls,ofx,qfx,qif,jpg,jpeg,png,gif").split(",")

def validate_file(file: UploadFile) -> tuple[bool, str]:
    """Validate uploaded file"""
    
    # Check file extension
    if file.filename:
        ext = file.filename.split(".")[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            return False, f"File type .{ext} not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
    
    # Check file size (this is approximate as we haven't read the full file yet)
    if hasattr(file, 'size') and file.size and file.size > MAX_FILE_SIZE:
        return False, f"File too large. Maximum size: {MAX_FILE_SIZE} bytes"
    
    return True, "Valid"

async def save_uploaded_file(file: UploadFile, document_id: str) -> tuple[str, int]:
    """Save uploaded file to disk and return path and size"""
    
    # Create company-specific subdirectory
    file_ext = file.filename.split(".")[-1].lower() if file.filename else "unknown"
    filename = f"{document_id}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    # Ensure upload directory exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Save file
    file_size = 0
    async with aiofiles.open(file_path, 'wb') as f:
        while chunk := await file.read(8192):  # Read in 8KB chunks
            file_size += len(chunk)
            
            # Check file size during upload
            if file_size > MAX_FILE_SIZE:
                # Clean up partial file
                try:
                    os.remove(file_path)
                except:
                    pass
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File too large. Maximum size: {MAX_FILE_SIZE} bytes"
                )
            
            await f.write(chunk)
    
    return file_path, file_size

def detect_document_type(filename: str, file_content: bytes = None) -> DocumentType:
    """Detect document type based on filename and content"""
    
    filename_lower = filename.lower()
    
    # Simple filename-based detection
    if any(keyword in filename_lower for keyword in ['statement', 'bank']):
        return DocumentType.BANK_STATEMENT
    elif any(keyword in filename_lower for keyword in ['credit', 'card']):
        return DocumentType.CREDIT_CARD_STATEMENT
    elif any(keyword in filename_lower for keyword in ['receipt', 'purchase']):
        return DocumentType.RECEIPT
    elif any(keyword in filename_lower for keyword in ['invoice', 'bill']):
        return DocumentType.INVOICE
    elif any(keyword in filename_lower for keyword in ['payroll', 'paystub', 'salary']):
        return DocumentType.PAYROLL_STUB
    elif any(keyword in filename_lower for keyword in ['vendor', 'supplier']):
        return DocumentType.VENDOR_STATEMENT
    elif any(keyword in filename_lower for keyword in ['tax', '1099', 'w2']):
        return DocumentType.TAX_DOCUMENT
    
    return DocumentType.OTHER

@documents_router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    document_type: Optional[DocumentType] = Form(None),
    tags: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Upload a financial document for processing"""
    
    # Validate file
    is_valid, message = validate_file(file)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    
    # Generate document ID
    document_id = str(uuid.uuid4())
    
    try:
        # Save file
        file_path, file_size = await save_uploaded_file(file, document_id)
        
        # Detect document type if not provided
        detected_type = document_type or detect_document_type(file.filename or "")
        
        # Parse tags
        parsed_tags = [tag.strip() for tag in tags.split(",")] if tags else []
        
        # Get file type
        file_type = mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
        
        # Create document record
        document_doc = {
            "_id": document_id,
            "company_id": current_user["company_id"],
            "user_id": current_user["_id"],
            "filename": os.path.basename(file_path),
            "original_filename": file.filename,
            "file_path": file_path,
            "file_size": file_size,
            "file_type": file_type,
            "document_type": detected_type,
            "processing_status": ProcessingStatus.UPLOADED,
            "upload_date": datetime.utcnow(),
            "processed_date": None,
            "extracted_data": None,
            "confidence_score": None,
            "error_message": None,
            "tags": parsed_tags,
            "metadata": {
                "original_size": file_size,
                "checksum": None  # TODO: Calculate file checksum
            }
        }
        
        # Insert document
        await documents_collection.insert_one(document_doc)
        
        # Log audit event
        await log_audit_event(
            user_id=current_user["_id"],
            company_id=current_user["company_id"],
            action="document_uploaded",
            details={
                "document_id": document_id,
                "filename": file.filename,
                "document_type": detected_type,
                "file_size": file_size
            }
        )
        
        # TODO: Trigger async document processing
        # await process_document_async(document_id)
        
        return DocumentResponse(
            id=document_id,
            filename=document_doc["filename"],
            original_filename=document_doc["original_filename"],
            file_size=file_size,
            file_type=file_type,
            document_type=detected_type,
            processing_status=ProcessingStatus.UPLOADED,
            upload_date=document_doc["upload_date"],
            processed_date=None,
            extracted_data=None,
            confidence_score=None,
            error_message=None,
            tags=parsed_tags
        )
        
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        
        # Clean up file if it was created
        try:
            if 'file_path' in locals():
                os.remove(file_path)
        except:
            pass
            
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload document"
        )

@documents_router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    document_type: Optional[DocumentType] = None,
    processing_status: Optional[ProcessingStatus] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """List user's documents with optional filtering"""
    
    # Build query
    query = {"company_id": current_user["company_id"]}
    
    if document_type:
        query["document_type"] = document_type
    
    if processing_status:
        query["processing_status"] = processing_status
    
    # Execute query
    cursor = documents_collection.find(query).sort("upload_date", -1).skip(offset).limit(limit)
    documents = await cursor.to_list(length=limit)
    
    # Convert to response format
    response_docs = []
    for doc in documents:
        response_docs.append(DocumentResponse(
            id=doc["_id"],
            filename=doc["filename"],
            original_filename=doc["original_filename"],
            file_size=doc["file_size"],
            file_type=doc["file_type"],
            document_type=doc["document_type"],
            processing_status=doc["processing_status"],
            upload_date=doc["upload_date"],
            processed_date=doc.get("processed_date"),
            extracted_data=doc.get("extracted_data"),
            confidence_score=doc.get("confidence_score"),
            error_message=doc.get("error_message"),
            tags=doc.get("tags", [])
        ))
    
    return response_docs

@documents_router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific document details"""
    
    document = await documents_collection.find_one({
        "_id": document_id,
        "company_id": current_user["company_id"]
    })
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return DocumentResponse(
        id=document["_id"],
        filename=document["filename"],
        original_filename=document["original_filename"],
        file_size=document["file_size"],
        file_type=document["file_type"],
        document_type=document["document_type"],
        processing_status=document["processing_status"],
        upload_date=document["upload_date"],
        processed_date=document.get("processed_date"),
        extracted_data=document.get("extracted_data"),
        confidence_score=document.get("confidence_score"),
        error_message=document.get("error_message"),
        tags=document.get("tags", [])
    )

@documents_router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str,
    update_data: DocumentUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update document metadata"""
    
    # Check if document exists and belongs to user's company
    document = await documents_collection.find_one({
        "_id": document_id,
        "company_id": current_user["company_id"]
    })
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Prepare update data
    update_fields = {}
    if update_data.document_type is not None:
        update_fields["document_type"] = update_data.document_type
    if update_data.tags is not None:
        update_fields["tags"] = update_data.tags
    if update_data.extracted_data is not None:
        update_fields["extracted_data"] = update_data.extracted_data
    
    if update_fields:
        await documents_collection.update_one(
            {"_id": document_id},
            {"$set": update_fields}
        )
        
        # Log audit event
        await log_audit_event(
            user_id=current_user["_id"],
            company_id=current_user["company_id"],
            action="document_updated",
            details={
                "document_id": document_id,
                "updated_fields": list(update_fields.keys())
            }
        )
    
    # Return updated document
    return await get_document(document_id, current_user)

@documents_router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a document"""
    
    # Check if document exists and belongs to user's company
    document = await documents_collection.find_one({
        "_id": document_id,
        "company_id": current_user["company_id"]
    })
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Delete file from disk
    try:
        if os.path.exists(document["file_path"]):
            os.remove(document["file_path"])
    except Exception as e:
        logger.warning(f"Failed to delete file {document['file_path']}: {e}")
    
    # Delete document record
    await documents_collection.delete_one({"_id": document_id})
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="document_deleted",
        details={
            "document_id": document_id,
            "filename": document["original_filename"]
        }
    )
    
    return {"message": "Document deleted successfully"}

@documents_router.post("/{document_id}/process")
async def process_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Trigger document processing manually"""
    
    # Check if document exists and belongs to user's company
    document = await documents_collection.find_one({
        "_id": document_id,
        "company_id": current_user["company_id"]
    })
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Update processing status
    await documents_collection.update_one(
        {"_id": document_id},
        {"$set": {"processing_status": ProcessingStatus.PROCESSING}}
    )
    
    # TODO: Trigger actual document processing
    # This would normally trigger an async task or call to ML services
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="document_processing_triggered",
        details={"document_id": document_id}
    )
    
    return {"message": "Document processing started"}