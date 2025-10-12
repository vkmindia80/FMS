"""Account Reconciliation Module - Bank statement matching and reconciliation"""
from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime, date, timedelta
from decimal import Decimal
import uuid
import csv
import io
import logging
import re
from xml.etree import ElementTree as ET

from auth import get_current_user, log_audit_event
from database import (
    reconciliation_sessions_collection,
    reconciliation_matches_collection,
    transactions_collection,
    accounts_collection
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic Models
class BankStatementEntry(BaseModel):
    date: date
    description: str
    amount: Decimal
    reference: Optional[str] = None
    balance: Optional[Decimal] = None

class ReconciliationSessionCreate(BaseModel):
    account_id: str
    statement_date: date
    opening_balance: Decimal
    closing_balance: Decimal
    auto_match: bool = Field(default=False, description="Automatically approve high-confidence matches")

class TransactionMatch(BaseModel):
    bank_entry_id: str
    system_transaction_id: str
    confidence_score: float = Field(..., ge=0.0, le=1.0)

class ReconciliationMatchRequest(BaseModel):
    session_id: str
    matches: List[TransactionMatch]

class ReconciliationCompleteRequest(BaseModel):
    session_id: str
    notes: Optional[str] = None

# Statement Parsers
def parse_csv_statement(file_content: str) -> List[Dict[str, Any]]:
    """Parse CSV bank statement - supports common formats"""
    entries = []
    
    # Try to detect CSV format and parse
    lines = file_content.strip().split('\n')
    
    # Skip header rows (try to detect)
    start_row = 0
    for i, line in enumerate(lines):
        lower_line = line.lower()
        if any(keyword in lower_line for keyword in ['date', 'transaction', 'amount', 'description']):
            start_row = i + 1
            break
    
    csv_reader = csv.reader(lines[start_row:])
    
    for row in csv_reader:
        if len(row) < 3:  # Need at least date, description, amount
            continue
        
        try:
            # Common CSV formats:
            # Format 1: Date, Description, Amount, Balance
            # Format 2: Date, Description, Debit, Credit, Balance
            # Format 3: Transaction Date, Description, Amount
            
            entry = {}
            
            # Try to parse date (first column usually)
            date_str = row[0].strip()
            entry['date'] = parse_date(date_str)
            
            # Description (second column usually)
            entry['description'] = row[1].strip() if len(row) > 1 else ""
            
            # Amount parsing - handle debit/credit or single amount column
            if len(row) >= 4 and is_number(row[2]) and is_number(row[3]):
                # Debit/Credit format
                debit = Decimal(row[2].replace(',', '').replace('$', '')) if row[2].strip() else Decimal('0')
                credit = Decimal(row[3].replace(',', '').replace('$', '')) if row[3].strip() else Decimal('0')
                entry['amount'] = credit - debit  # Positive for deposits, negative for withdrawals
                
                if len(row) > 4:
                    entry['balance'] = Decimal(row[4].replace(',', '').replace('$', '')) if row[4].strip() else None
            else:
                # Single amount column
                amount_str = row[2].replace(',', '').replace('$', '').strip() if len(row) > 2 else "0"
                entry['amount'] = Decimal(amount_str)
                
                if len(row) > 3:
                    entry['balance'] = Decimal(row[3].replace(',', '').replace('$', '')) if row[3].strip() else None
            
            entry['reference'] = row[0].strip()[:20]  # Use date as reference
            
            entries.append(entry)
            
        except Exception as e:
            logger.warning(f"Failed to parse CSV row {row}: {str(e)}")
            continue
    
    return entries

def parse_ofx_statement(file_content: str) -> List[Dict[str, Any]]:
    """Parse OFX/QFX bank statement (XML-based format)"""
    entries = []
    
    try:
        # OFX can have SGML or XML format
        # Try to convert SGML headers to XML if needed
        if not file_content.strip().startswith('<?xml'):
            # Find the start of transactions
            start_idx = file_content.find('<OFX>')
            if start_idx == -1:
                start_idx = file_content.find('<ofx>')
            if start_idx != -1:
                file_content = '<?xml version="1.0"?>\n' + file_content[start_idx:]
        
        # Parse XML
        root = ET.fromstring(file_content)
        
        # Find all transaction elements (STMTTRN)
        # OFX structure: OFX/BANKMSGSRSV1/STMTTRNRS/STMTRS/BANKTRANLIST/STMTTRN
        namespaces = {'': ''}  # OFX typically doesn't use namespaces
        
        # Try different possible paths
        transaction_elements = []
        for path in ['.//STMTTRN', './/stmttrn', './/STMTTRN', './/*[local-name()="STMTTRN"]']:
            transaction_elements = root.findall(path)
            if transaction_elements:
                break
        
        for txn in transaction_elements:
            try:
                entry = {}
                
                # Date (DTPOSTED)
                date_elem = txn.find('.//DTPOSTED') or txn.find('.//dtposted')
                if date_elem is not None and date_elem.text:
                    # OFX date format: YYYYMMDD or YYYYMMDDHHMMSS
                    date_str = date_elem.text[:8]
                    entry['date'] = datetime.strptime(date_str, '%Y%m%d').date()
                else:
                    continue  # Skip entries without date
                
                # Amount (TRNAMT)
                amount_elem = txn.find('.//TRNAMT') or txn.find('.//trnamt')
                if amount_elem is not None and amount_elem.text:
                    entry['amount'] = Decimal(amount_elem.text)
                
                # Description (NAME or MEMO)
                name_elem = txn.find('.//NAME') or txn.find('.//name')
                memo_elem = txn.find('.//MEMO') or txn.find('.//memo')
                
                description = ""
                if name_elem is not None and name_elem.text:
                    description = name_elem.text
                if memo_elem is not None and memo_elem.text:
                    description = f"{description} - {memo_elem.text}" if description else memo_elem.text
                
                entry['description'] = description.strip()
                
                # Reference (FITID)
                fitid_elem = txn.find('.//FITID') or txn.find('.//fitid')
                if fitid_elem is not None and fitid_elem.text:
                    entry['reference'] = fitid_elem.text
                
                entries.append(entry)
                
            except Exception as e:
                logger.warning(f"Failed to parse OFX transaction: {str(e)}")
                continue
        
    except Exception as e:
        logger.error(f"Failed to parse OFX file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OFX/QFX format: {str(e)}"
        )
    
    return entries

def parse_qfx_statement(file_content: str) -> List[Dict[str, Any]]:
    """Parse QFX bank statement (Quicken format, similar to OFX)"""
    # QFX is essentially OFX format
    return parse_ofx_statement(file_content)

def parse_date(date_str: str) -> date:
    """Parse date string in various formats"""
    date_formats = [
        '%Y-%m-%d',
        '%m/%d/%Y',
        '%d/%m/%Y',
        '%Y/%m/%d',
        '%m-%d-%Y',
        '%d-%m-%Y',
        '%m/%d/%y',
        '%d/%m/%y',
        '%b %d, %Y',
        '%B %d, %Y',
        '%d %b %Y',
        '%d %B %Y',
    ]
    
    for fmt in date_formats:
        try:
            return datetime.strptime(date_str.strip(), fmt).date()
        except ValueError:
            continue
    
    raise ValueError(f"Unable to parse date: {date_str}")

def is_number(s: str) -> bool:
    """Check if string can be converted to a number"""
    try:
        float(s.replace(',', '').replace('$', '').strip())
        return True
    except (ValueError, AttributeError):
        return False

# Matching Algorithms
def calculate_match_confidence(
    bank_entry: Dict[str, Any],
    system_txn: Dict[str, Any],
    tolerance_amount: Decimal = Decimal('0.01'),
    tolerance_days: int = 2
) -> float:
    """Calculate confidence score for a potential match (0.0 to 1.0)"""
    
    confidence = 0.0
    
    # Amount matching (50% weight)
    bank_amount = abs(Decimal(str(bank_entry['amount'])))
    system_amount = abs(Decimal(str(system_txn['amount'])))
    amount_diff = abs(bank_amount - system_amount)
    
    if amount_diff == 0:
        confidence += 0.5
    elif amount_diff <= tolerance_amount:
        confidence += 0.4
    elif amount_diff <= tolerance_amount * 5:
        confidence += 0.2
    
    # Date matching (30% weight)
    bank_date = bank_entry['date']
    system_date = system_txn['transaction_date'].date() if isinstance(system_txn['transaction_date'], datetime) else system_txn['transaction_date']
    
    date_diff = abs((bank_date - system_date).days)
    
    if date_diff == 0:
        confidence += 0.3
    elif date_diff <= tolerance_days:
        confidence += 0.2
    elif date_diff <= tolerance_days * 2:
        confidence += 0.1
    
    # Description similarity (20% weight)
    bank_desc = bank_entry['description'].lower()
    system_desc = system_txn['description'].lower()
    
    # Simple word matching
    bank_words = set(re.findall(r'\w+', bank_desc))
    system_words = set(re.findall(r'\w+', system_desc))
    
    if bank_words and system_words:
        common_words = bank_words.intersection(system_words)
        similarity = len(common_words) / max(len(bank_words), len(system_words))
        confidence += similarity * 0.2
    
    return round(confidence, 3)

async def find_matching_transactions(
    bank_entries: List[Dict[str, Any]],
    company_id: str,
    account_id: str,
    date_range_days: int = 30
) -> List[Dict[str, Any]]:
    """Find potential matches for bank statement entries"""
    
    if not bank_entries:
        return []
    
    # Get date range from bank entries
    dates = [entry['date'] for entry in bank_entries]
    min_date = min(dates) - timedelta(days=date_range_days)
    max_date = max(dates) + timedelta(days=date_range_days)
    
    # Get unreconciled system transactions in date range
    system_transactions = await transactions_collection.find({
        'company_id': company_id,
        'is_reconciled': False,
        'status': {'$ne': 'void'},
        'transaction_date': {
            '$gte': datetime.combine(min_date, datetime.min.time()),
            '$lte': datetime.combine(max_date, datetime.max.time())
        }
    }).to_list(length=None)
    
    matches = []
    
    for bank_entry in bank_entries:
        bank_entry_id = str(uuid.uuid4())
        bank_entry['id'] = bank_entry_id
        
        potential_matches = []
        
        for system_txn in system_transactions:
            confidence = calculate_match_confidence(bank_entry, system_txn)
            
            if confidence > 0.3:  # Only include matches with >30% confidence
                potential_matches.append({
                    'system_transaction_id': system_txn['_id'],
                    'confidence_score': confidence,
                    'system_transaction': {
                        'id': system_txn['_id'],
                        'date': system_txn['transaction_date'],
                        'description': system_txn['description'],
                        'amount': system_txn['amount'],
                        'reference_number': system_txn.get('reference_number')
                    }
                })
        
        # Sort by confidence (highest first)
        potential_matches.sort(key=lambda x: x['confidence_score'], reverse=True)
        
        matches.append({
            'bank_entry_id': bank_entry_id,
            'bank_entry': bank_entry,
            'suggested_matches': potential_matches[:5]  # Top 5 matches
        })
    
    return matches

# API Endpoints
@router.post("/upload-statement")
async def upload_bank_statement(
    account_id: str = Query(...),
    statement_date: date = Query(...),
    opening_balance: Decimal = Query(...),
    closing_balance: Decimal = Query(...),
    auto_match: bool = Query(default=False),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload and parse bank statement file"""
    
    try:
        company_id = current_user['company_id']
        user_id = current_user['_id']
        
        # Verify account exists
        account = await accounts_collection.find_one({
            '_id': account_id,
            'company_id': company_id
        })
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        # Read file content
        content = await file.read()
        file_content = content.decode('utf-8', errors='ignore')
        
        # Parse based on file extension
        filename = file.filename.lower()
        
        if filename.endswith('.csv'):
            entries = parse_csv_statement(file_content)
        elif filename.endswith('.ofx'):
            entries = parse_ofx_statement(file_content)
        elif filename.endswith('.qfx'):
            entries = parse_qfx_statement(file_content)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported file format. Please upload CSV, OFX, or QFX file."
            )
        
        if not entries:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No transactions found in statement file"
            )
        
        # Find potential matches
        matches = await find_matching_transactions(entries, company_id, account_id)
        
        # Create reconciliation session
        session_id = str(uuid.uuid4())
        session_doc = {
            '_id': session_id,
            'company_id': company_id,
            'user_id': user_id,
            'account_id': account_id,
            'account_name': account['name'],
            'statement_date': datetime.combine(statement_date, datetime.min.time()),
            'opening_balance': float(opening_balance),
            'closing_balance': float(closing_balance),
            'auto_match': auto_match,
            'filename': file.filename,
            'status': 'in_progress',
            'bank_entries': [
                {
                    'id': entry['id'],
                    'date': entry['date'].isoformat(),
                    'description': entry['description'],
                    'amount': float(entry['amount']),
                    'reference': entry.get('reference'),
                    'balance': float(entry['balance']) if entry.get('balance') else None,
                    'matched': False,
                    'matched_transaction_id': None
                }
                for entry in entries
            ],
            'total_bank_entries': len(entries),
            'matched_count': 0,
            'unmatched_count': len(entries),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        await reconciliation_sessions_collection.insert_one(session_doc)
        
        # Auto-match high confidence matches if enabled
        auto_matched_count = 0
        if auto_match:
            for match in matches:
                if match['suggested_matches'] and match['suggested_matches'][0]['confidence_score'] >= 0.8:
                    # Auto-approve matches with 80%+ confidence
                    best_match = match['suggested_matches'][0]
                    
                    match_doc = {
                        '_id': str(uuid.uuid4()),
                        'session_id': session_id,
                        'bank_entry_id': match['bank_entry_id'],
                        'system_transaction_id': best_match['system_transaction_id'],
                        'confidence_score': best_match['confidence_score'],
                        'match_type': 'automatic',
                        'matched_at': datetime.utcnow(),
                        'matched_by': user_id
                    }
                    
                    await reconciliation_matches_collection.insert_one(match_doc)
                    
                    # Update session
                    await reconciliation_sessions_collection.update_one(
                        {'_id': session_id},
                        {
                            '$inc': {'matched_count': 1, 'unmatched_count': -1},
                            '$set': {f'bank_entries.{matches.index(match)}.matched': True,
                                   f'bank_entries.{matches.index(match)}.matched_transaction_id': best_match['system_transaction_id']}
                        }
                    )
                    
                    auto_matched_count += 1
        
        # Audit log
        await log_audit_event(
            user_id=user_id,
            company_id=company_id,
            action='reconciliation_session_created',
            details={
                'session_id': session_id,
                'account_id': account_id,
                'entries_count': len(entries),
                'auto_matched': auto_matched_count
            }
        )
        
        logger.info(f"Reconciliation session {session_id} created with {len(entries)} entries")
        
        return {
            'success': True,
            'session_id': session_id,
            'entries_count': len(entries),
            'matches': matches,
            'auto_matched_count': auto_matched_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading statement: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload statement: {str(e)}"
        )

@router.get("/sessions")
async def list_reconciliation_sessions(
    account_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List reconciliation sessions"""
    
    query = {'company_id': current_user['company_id']}
    
    if account_id:
        query['account_id'] = account_id
    
    if status_filter:
        query['status'] = status_filter
    
    sessions = await reconciliation_sessions_collection.find(query).sort('created_at', -1).to_list(length=100)
    
    for session in sessions:
        session['_id'] = str(session['_id'])
    
    return {'sessions': sessions}

@router.get("/sessions/{session_id}")
async def get_reconciliation_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get reconciliation session details"""
    
    session = await reconciliation_sessions_collection.find_one({
        '_id': session_id,
        'company_id': current_user['company_id']
    })
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reconciliation session not found"
        )
    
    # Get matches for this session
    matches = await reconciliation_matches_collection.find({
        'session_id': session_id
    }).to_list(length=None)
    
    session['_id'] = str(session['_id'])
    session['matches'] = matches
    
    return session

@router.post("/match")
async def match_transactions(
    request: ReconciliationMatchRequest,
    current_user: dict = Depends(get_current_user)
):
    """Manually match bank entries with system transactions"""
    
    try:
        session = await reconciliation_sessions_collection.find_one({
            '_id': request.session_id,
            'company_id': current_user['company_id']
        })
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reconciliation session not found"
            )
        
        if session['status'] == 'completed':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify completed reconciliation"
            )
        
        matched_count = 0
        
        for match in request.matches:
            # Check if already matched
            existing = await reconciliation_matches_collection.find_one({
                'session_id': request.session_id,
                'bank_entry_id': match.bank_entry_id
            })
            
            if existing:
                continue
            
            # Create match
            match_doc = {
                '_id': str(uuid.uuid4()),
                'session_id': request.session_id,
                'bank_entry_id': match.bank_entry_id,
                'system_transaction_id': match.system_transaction_id,
                'confidence_score': match.confidence_score,
                'match_type': 'manual',
                'matched_at': datetime.utcnow(),
                'matched_by': current_user['_id']
            }
            
            await reconciliation_matches_collection.insert_one(match_doc)
            matched_count += 1
        
        # Update session counts
        await reconciliation_sessions_collection.update_one(
            {'_id': request.session_id},
            {
                '$inc': {'matched_count': matched_count, 'unmatched_count': -matched_count},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
        
        return {
            'success': True,
            'matched_count': matched_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error matching transactions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to match transactions: {str(e)}"
        )

@router.post("/unmatch")
async def unmatch_transaction(
    session_id: str,
    bank_entry_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Unmatch a bank entry from system transaction"""
    
    session = await reconciliation_sessions_collection.find_one({
        '_id': session_id,
        'company_id': current_user['company_id']
    })
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reconciliation session not found"
        )
    
    if session['status'] == 'completed':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify completed reconciliation"
        )
    
    # Remove match
    result = await reconciliation_matches_collection.delete_one({
        'session_id': session_id,
        'bank_entry_id': bank_entry_id
    })
    
    if result.deleted_count > 0:
        # Update session counts
        await reconciliation_sessions_collection.update_one(
            {'_id': session_id},
            {
                '$inc': {'matched_count': -1, 'unmatched_count': 1},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
    
    return {'success': True}

@router.post("/complete")
async def complete_reconciliation(
    request: ReconciliationCompleteRequest,
    current_user: dict = Depends(get_current_user)
):
    """Complete reconciliation and mark transactions as reconciled"""
    
    try:
        session = await reconciliation_sessions_collection.find_one({
            '_id': request.session_id,
            'company_id': current_user['company_id']
        })
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reconciliation session not found"
            )
        
        if session['status'] == 'completed':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reconciliation already completed"
            )
        
        # Get all matches
        matches = await reconciliation_matches_collection.find({
            'session_id': request.session_id
        }).to_list(length=None)
        
        # Mark system transactions as reconciled
        transaction_ids = [match['system_transaction_id'] for match in matches]
        
        if transaction_ids:
            await transactions_collection.update_many(
                {'_id': {'$in': transaction_ids}},
                {
                    '$set': {
                        'is_reconciled': True,
                        'reconciled_at': datetime.utcnow(),
                        'reconciled_by': current_user['_id'],
                        'reconciliation_session_id': request.session_id
                    }
                }
            )
        
        # Update session
        await reconciliation_sessions_collection.update_one(
            {'_id': request.session_id},
            {
                '$set': {
                    'status': 'completed',
                    'completed_at': datetime.utcnow(),
                    'completed_by': current_user['_id'],
                    'notes': request.notes,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        # Audit log
        await log_audit_event(
            user_id=current_user['_id'],
            company_id=current_user['company_id'],
            action='reconciliation_completed',
            details={
                'session_id': request.session_id,
                'account_id': session['account_id'],
                'matched_count': len(matches),
                'unmatched_count': session['unmatched_count']
            }
        )
        
        logger.info(f"Reconciliation {request.session_id} completed with {len(matches)} matches")
        
        return {
            'success': True,
            'reconciled_count': len(transaction_ids),
            'message': 'Reconciliation completed successfully'
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing reconciliation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete reconciliation: {str(e)}"
        )

@router.get("/report/{session_id}")
async def get_reconciliation_report(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Generate reconciliation report"""
    
    session = await reconciliation_sessions_collection.find_one({
        '_id': session_id,
        'company_id': current_user['company_id']
    })
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reconciliation session not found"
        )
    
    # Get matches
    matches = await reconciliation_matches_collection.find({
        'session_id': session_id
    }).to_list(length=None)
    
    # Get matched transaction details
    matched_transaction_ids = [match['system_transaction_id'] for match in matches]
    matched_transactions = []
    
    if matched_transaction_ids:
        matched_transactions = await transactions_collection.find({
            '_id': {'$in': matched_transaction_ids}
        }).to_list(length=None)
    
    # Calculate reconciliation summary
    total_bank_amount = sum(Decimal(str(entry['amount'])) for entry in session['bank_entries'])
    total_matched_amount = sum(Decimal(str(txn['amount'])) for txn in matched_transactions)
    
    unmatched_bank_entries = [
        entry for entry in session['bank_entries']
        if not entry.get('matched', False)
    ]
    
    report = {
        'session_id': session_id,
        'account_name': session['account_name'],
        'statement_date': session['statement_date'],
        'opening_balance': session['opening_balance'],
        'closing_balance': session['closing_balance'],
        'status': session['status'],
        'summary': {
            'total_bank_entries': session['total_bank_entries'],
            'matched_count': session['matched_count'],
            'unmatched_count': session['unmatched_count'],
            'total_bank_amount': float(total_bank_amount),
            'total_matched_amount': float(total_matched_amount),
            'difference': float(total_bank_amount - total_matched_amount)
        },
        'matched_transactions': [
            {
                'bank_entry_id': match['bank_entry_id'],
                'system_transaction_id': match['system_transaction_id'],
                'confidence_score': match['confidence_score'],
                'match_type': match['match_type']
            }
            for match in matches
        ],
        'unmatched_entries': unmatched_bank_entries,
        'created_at': session['created_at'],
        'completed_at': session.get('completed_at')
    }
    
    return report

@router.delete("/sessions/{session_id}")
async def delete_reconciliation_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a reconciliation session"""
    
    session = await reconciliation_sessions_collection.find_one({
        '_id': session_id,
        'company_id': current_user['company_id']
    })
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reconciliation session not found"
        )
    
    if session['status'] == 'completed':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete completed reconciliation"
        )
    
    # Delete matches
    await reconciliation_matches_collection.delete_many({'session_id': session_id})
    
    # Delete session
    await reconciliation_sessions_collection.delete_one({'_id': session_id})
    
    return {'success': True, 'message': 'Reconciliation session deleted'}
