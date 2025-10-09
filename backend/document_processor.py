import os
import uuid
import pytesseract
import cv2
import numpy as np
from PIL import Image
from datetime import datetime
from typing import Dict, Any, Optional
import logging
import asyncio
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import LLM integration
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType
except ImportError:
    LlmChat = None
    UserMessage = None
    FileContentWithMimeType = None

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Advanced document processor using both traditional OCR and AI-powered analysis"""
    
    def __init__(self):
        self.emergent_llm_key = os.getenv("EMERGENT_LLM_KEY")
        if not self.emergent_llm_key:
            logger.warning("EMERGENT_LLM_KEY not found. AI processing will be disabled.")

    async def process_document(self, document_path: str, document_type: str) -> Dict[str, Any]:
        """
        Process document using both OCR and AI analysis
        
        Args:
            document_path: Path to the document file
            document_type: Type of document (receipt, invoice, etc.)
            
        Returns:
            Dictionary containing extracted data and confidence scores
        """
        try:
            logger.info(f"Starting document processing for {document_path}")
            
            # Determine file type and processing method
            file_ext = os.path.splitext(document_path)[1].lower()
            
            processing_results = {
                "ocr_text": "",
                "structured_data": {},
                "confidence_score": 0.0,
                "processing_method": "",
                "ai_analysis": {},
                "extraction_details": {}
            }
            
            if file_ext in ['.jpg', '.jpeg', '.png', '.gif']:
                # Image processing - Use both OCR and AI
                processing_results = await self._process_image_document(document_path, document_type)
            elif file_ext == '.pdf':
                # PDF processing - Use AI with file attachment
                processing_results = await self._process_pdf_document(document_path, document_type)
            else:
                # Text-based files - Use AI analysis
                processing_results = await self._process_text_document(document_path, document_type)
            
            logger.info(f"Document processing completed with confidence: {processing_results.get('confidence_score', 0)}")
            return processing_results
            
        except Exception as e:
            logger.error(f"Error processing document {document_path}: {str(e)}")
            return {
                "ocr_text": "",
                "structured_data": {},
                "confidence_score": 0.0,
                "processing_method": "error",
                "error": str(e),
                "ai_analysis": {},
                "extraction_details": {}
            }

    async def _process_image_document(self, document_path: str, document_type: str) -> Dict[str, Any]:
        """Process image documents using OCR + AI analysis"""
        
        # Step 1: Traditional OCR processing
        ocr_text = self._extract_text_with_ocr(document_path)
        
        # Step 2: AI-powered analysis if available
        ai_analysis = {}
        structured_data = {}
        
        if self.emergent_llm_key and LlmChat:
            try:
                ai_analysis = await self._analyze_with_ai(document_path, document_type, ocr_text)
                structured_data = ai_analysis.get('structured_data', {})
            except Exception as e:
                logger.warning(f"AI analysis failed, falling back to OCR only: {str(e)}")
                structured_data = self._extract_structured_data_from_ocr(ocr_text, document_type)
        else:
            # Fallback to rule-based extraction from OCR text
            structured_data = self._extract_structured_data_from_ocr(ocr_text, document_type)
        
        # Calculate confidence score
        confidence_score = self._calculate_confidence_score(ocr_text, structured_data, ai_analysis)
        
        return {
            "ocr_text": ocr_text,
            "structured_data": structured_data,
            "confidence_score": confidence_score,
            "processing_method": "ocr_ai_hybrid" if ai_analysis else "ocr_only",
            "ai_analysis": ai_analysis,
            "extraction_details": {
                "ocr_length": len(ocr_text),
                "extracted_fields": len(structured_data),
                "processing_time": datetime.utcnow().isoformat()
            }
        }

    async def _process_pdf_document(self, document_path: str, document_type: str) -> Dict[str, Any]:
        """Process PDF documents using AI analysis"""
        
        if not self.emergent_llm_key or not LlmChat:
            return {
                "ocr_text": "PDF processing requires AI integration",
                "structured_data": {},
                "confidence_score": 0.0,
                "processing_method": "unavailable",
                "ai_analysis": {},
                "extraction_details": {}
            }
        
        try:
            ai_analysis = await self._analyze_with_ai(document_path, document_type)
            structured_data = ai_analysis.get('structured_data', {})
            
            confidence_score = self._calculate_confidence_score("", structured_data, ai_analysis)
            
            return {
                "ocr_text": ai_analysis.get('extracted_text', ''),
                "structured_data": structured_data,
                "confidence_score": confidence_score,
                "processing_method": "ai_pdf_analysis",
                "ai_analysis": ai_analysis,
                "extraction_details": {
                    "file_type": "pdf",
                    "extracted_fields": len(structured_data),
                    "processing_time": datetime.utcnow().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"PDF processing failed: {str(e)}")
            return {
                "ocr_text": "",
                "structured_data": {},
                "confidence_score": 0.0,
                "processing_method": "error",
                "error": str(e),
                "ai_analysis": {},
                "extraction_details": {}
            }

    async def _process_text_document(self, document_path: str, document_type: str) -> Dict[str, Any]:
        """Process text-based documents"""
        
        try:
            # Read text file
            with open(document_path, 'r', encoding='utf-8') as f:
                text_content = f.read()
            
            # Use AI analysis if available
            if self.emergent_llm_key and LlmChat:
                ai_analysis = await self._analyze_with_ai(document_path, document_type, text_content)
                structured_data = ai_analysis.get('structured_data', {})
            else:
                # Fallback to rule-based extraction
                structured_data = self._extract_structured_data_from_ocr(text_content, document_type)
                ai_analysis = {}
            
            confidence_score = self._calculate_confidence_score(text_content, structured_data, ai_analysis)
            
            return {
                "ocr_text": text_content,
                "structured_data": structured_data,
                "confidence_score": confidence_score,
                "processing_method": "text_ai_analysis" if ai_analysis else "text_rules",
                "ai_analysis": ai_analysis,
                "extraction_details": {
                    "file_type": "text",
                    "text_length": len(text_content),
                    "extracted_fields": len(structured_data),
                    "processing_time": datetime.utcnow().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Text processing failed: {str(e)}")
            return {
                "ocr_text": "",
                "structured_data": {},
                "confidence_score": 0.0,
                "processing_method": "error",
                "error": str(e),
                "ai_analysis": {},
                "extraction_details": {}
            }

    def _extract_text_with_ocr(self, image_path: str) -> str:
        """Extract text from image using Tesseract OCR"""
        
        try:
            # Load and preprocess image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not load image: {image_path}")
            
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply image preprocessing to improve OCR accuracy
            # Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Adaptive thresholding
            thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
            
            # Morphological operations to clean up
            kernel = np.ones((1, 1), np.uint8)
            cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            
            # Extract text using Tesseract
            custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,!@#$%^&*()_+-=[]{}|;":,.<>?/~ '
            text = pytesseract.image_to_string(cleaned, config=custom_config)
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"OCR extraction failed for {image_path}: {str(e)}")
            return ""

    async def _analyze_with_ai(self, document_path: str, document_type: str, ocr_text: str = "") -> Dict[str, Any]:
        """Analyze document using AI (Emergent LLM)"""
        
        if not self.emergent_llm_key or not LlmChat:
            raise ValueError("AI analysis not available - missing LLM integration")
        
        try:
            # Create LLM chat instance
            session_id = f"doc_analysis_{uuid.uuid4().hex[:8]}"
            
            system_message = f"""You are an expert financial document analyst. Your task is to extract structured data from {document_type} documents.

Extract the following information in JSON format:
- amount: Total amount (number)
- date: Transaction date (YYYY-MM-DD format)
- vendor: Vendor/merchant name
- category: Expense category
- description: Transaction description
- line_items: List of individual items (if applicable)
- tax_amount: Tax amount if specified
- payment_method: Payment method if mentioned
- reference_number: Any reference/invoice numbers

Be precise and only extract information that is clearly visible in the document. Return valid JSON only."""

            chat = LlmChat(
                api_key=self.emergent_llm_key,
                session_id=session_id,
                system_message=system_message
            ).with_model("openai", "gpt-4o-mini")
            
            # Prepare user message
            if os.path.splitext(document_path)[1].lower() == '.pdf':
                # For PDF files, use file attachment
                file_content = FileContentWithMimeType(
                    file_path=document_path,
                    mime_type="application/pdf"
                )
                
                # Switch to Gemini for file attachments
                chat = chat.with_model("gemini", "gemini-2.0-flash")
                
                user_message = UserMessage(
                    text=f"Analyze this {document_type} document and extract the structured financial data. Return only valid JSON.",
                    file_contents=[file_content]
                )
            else:
                # For images and text, include OCR text in prompt
                analysis_text = f"Document type: {document_type}\n\n"
                if ocr_text:
                    analysis_text += f"OCR Text:\n{ocr_text}\n\n"
                
                analysis_text += "Extract structured financial data from this document. Return only valid JSON."
                
                # For images, also attach the file if possible
                file_ext = os.path.splitext(document_path)[1].lower()
                if file_ext in ['.jpg', '.jpeg', '.png', '.gif']:
                    file_content = FileContentWithMimeType(
                        file_path=document_path,
                        mime_type=f"image/{file_ext[1:]}"
                    )
                    
                    # Switch to Gemini for file attachments
                    chat = chat.with_model("gemini", "gemini-2.0-flash")
                    
                    user_message = UserMessage(
                        text=analysis_text,
                        file_contents=[file_content]
                    )
                else:
                    user_message = UserMessage(text=analysis_text)
            
            # Get AI response
            response = await chat.send_message(user_message)
            
            # Parse AI response
            try:
                # Try to extract JSON from the response
                response_text = response.strip()
                
                # Find JSON in response (sometimes AI includes explanation)
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                
                if start_idx != -1 and end_idx != 0:
                    json_str = response_text[start_idx:end_idx]
                    structured_data = json.loads(json_str)
                else:
                    # Fallback: try parsing entire response
                    structured_data = json.loads(response_text)
                
                return {
                    "structured_data": structured_data,
                    "raw_response": response,
                    "extracted_text": ocr_text,
                    "ai_confidence": self._estimate_ai_confidence(structured_data, response)
                }
                
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse AI response as JSON: {str(e)}")
                return {
                    "structured_data": self._extract_fallback_data(response, document_type),
                    "raw_response": response,
                    "extracted_text": ocr_text,
                    "ai_confidence": 0.3,  # Low confidence for unparseable response
                    "parsing_error": str(e)
                }
                
        except Exception as e:
            logger.error(f"AI analysis failed: {str(e)}")
            raise

    def _extract_structured_data_from_ocr(self, text: str, document_type: str) -> Dict[str, Any]:
        """Extract structured data using rule-based methods from OCR text"""
        
        import re
        
        structured_data = {}
        
        # Extract amounts (looking for currency symbols and patterns)
        amount_patterns = [
            r'\$\s*(\d+(?:\.\d{2})?)',  # $123.45
            r'(\d+\.\d{2})\s*\$',      # 123.45$
            r'total[:\s]*\$?\s*(\d+(?:\.\d{2})?)',  # Total: $123.45
            r'amount[:\s]*\$?\s*(\d+(?:\.\d{2})?)'   # Amount: $123.45
        ]
        
        for pattern in amount_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                structured_data['amount'] = float(match.group(1))
                break
        
        # Extract dates
        date_patterns = [
            r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})',     # MM/DD/YYYY or MM-DD-YYYY
            r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})',     # YYYY/MM/DD or YYYY-MM-DD
            r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})'  # DD Mon YYYY
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                if len(match.groups()) == 3:
                    try:
                        if len(match.group(1)) == 4:  # YYYY format
                            structured_data['date'] = f"{match.group(1)}-{match.group(2).zfill(2)}-{match.group(3).zfill(2)}"
                        else:  # MM/DD format
                            structured_data['date'] = f"2025-{match.group(1).zfill(2)}-{match.group(2).zfill(2)}"  # Assume current year
                    except:
                        pass
                break
        
        # Extract vendor/merchant (usually at the top of receipt)
        lines = text.split('\n')
        for i, line in enumerate(lines[:5]):  # Check first 5 lines
            line = line.strip()
            if len(line) > 3 and not re.match(r'^\d', line) and 'receipt' not in line.lower():
                structured_data['vendor'] = line
                break
        
        # Extract description (use first meaningful line)
        if 'vendor' in structured_data:
            structured_data['description'] = f"Purchase from {structured_data['vendor']}"
        elif structured_data.get('amount'):
            structured_data['description'] = f"Transaction of ${structured_data['amount']}"
        
        # Set category based on document type
        category_mapping = {
            'receipt': 'office_supplies',
            'invoice': 'professional_services',
            'bank_statement': 'other_expense',
            'credit_card_statement': 'other_expense',
            'payroll_stub': 'salary',
            'other': 'other_expense'
        }
        structured_data['category'] = category_mapping.get(document_type, 'other_expense')
        
        return structured_data

    def _extract_fallback_data(self, ai_response: str, document_type: str) -> Dict[str, Any]:
        """Extract basic data when AI response can't be parsed as JSON"""
        
        # Try to extract basic information from the AI response text
        fallback_data = {}
        
        import re
        
        # Look for amount mentions
        amount_match = re.search(r'amount[:\s]*\$?(\d+(?:\.\d{2})?)', ai_response, re.IGNORECASE)
        if amount_match:
            try:
                fallback_data['amount'] = float(amount_match.group(1))
            except:
                pass
        
        # Look for date mentions
        date_match = re.search(r'date[:\s]*(\d{4}-\d{2}-\d{2})', ai_response, re.IGNORECASE)
        if date_match:
            fallback_data['date'] = date_match.group(1)
        
        # Look for vendor mentions
        vendor_match = re.search(r'vendor[:\s]*([^\n]+)', ai_response, re.IGNORECASE)
        if vendor_match:
            fallback_data['vendor'] = vendor_match.group(1).strip()
        
        fallback_data['description'] = "AI analysis - partial extraction"
        fallback_data['category'] = 'other_expense'
        
        return fallback_data

    def _estimate_ai_confidence(self, structured_data: Dict, raw_response: str) -> float:
        """Estimate confidence score for AI analysis"""
        
        confidence = 0.5  # Base confidence
        
        # Increase confidence based on extracted fields
        required_fields = ['amount', 'date', 'vendor', 'description']
        extracted_fields = sum(1 for field in required_fields if field in structured_data and structured_data[field])
        
        confidence += (extracted_fields / len(required_fields)) * 0.3
        
        # Check response quality indicators
        if 'total' in raw_response.lower() or 'amount' in raw_response.lower():
            confidence += 0.1
        
        if len(raw_response) > 50:  # Detailed response
            confidence += 0.1
        
        return min(confidence, 1.0)

    def _calculate_confidence_score(self, ocr_text: str, structured_data: Dict, ai_analysis: Dict) -> float:
        """Calculate overall confidence score for document processing"""
        
        base_confidence = 0.0
        
        # OCR text quality
        if ocr_text and len(ocr_text) > 10:
            base_confidence += 0.3
        
        # Structured data completeness
        required_fields = ['amount', 'date', 'vendor', 'description']
        extracted_fields = sum(1 for field in required_fields if field in structured_data and structured_data[field])
        base_confidence += (extracted_fields / len(required_fields)) * 0.4
        
        # AI analysis boost
        if ai_analysis and ai_analysis.get('ai_confidence'):
            base_confidence += ai_analysis['ai_confidence'] * 0.3
        
        return min(base_confidence, 1.0)

# Global processor instance
processor = DocumentProcessor()

async def process_document_async(document_path: str, document_type: str) -> Dict[str, Any]:
    """Async wrapper for document processing"""
    return await processor.process_document(document_path, document_type)