"""
Claims service module for Claims Processing service
"""

import json
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.schemas import models as schemas
from app.models import models as pydantic_models


def get_claim(db: Session, claim_reference_id: str) -> schemas.Claim:
    """
    Get a claim by reference ID
    """
    claim = db.query(schemas.Claim).filter(schemas.Claim.claim_reference_id == claim_reference_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim


def get_claims(
    db: Session, 
    claimant_id: Optional[str] = None, 
    status: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100
) -> List[schemas.Claim]:
    """
    Get claims with optional filtering
    """
    query = db.query(schemas.Claim)
    
    if claimant_id:
        query = query.filter(schemas.Claim.claimant_id == claimant_id)
    
    if status:
        query = query.filter(schemas.Claim.claim_status == status)
    
    return query.offset(skip).limit(limit).all()


def create_claim(db: Session, claim: pydantic_models.ClaimCreate) -> schemas.Claim:
    """
    Create a new claim
    """
    # Check if claimant exists
    claimant = db.query(schemas.Claimant).filter(schemas.Claimant.claimant_id == claim.claimant_id).first()
    
    if not claimant:
        raise HTTPException(status_code=404, detail="Claimant not found")
    
    # Create claim
    claim_reference_id = f"CL-{uuid.uuid4().hex[:10].upper()}"
    
    db_claim = schemas.Claim(
        claim_reference_id=claim_reference_id,
        claimant_id=claim.claimant_id,
        separation_reason=claim.separation_reason,
        claim_status="received",
        filing_date=datetime.now()
    )
    
    db.add(db_claim)
    db.commit()
    db.refresh(db_claim)
    
    # Create employment records
    for record in claim.employment_records:
        db_record = schemas.EmploymentRecord(
            claim_id=db_claim.id,
            employer_id=record.employer_id,
            employer_name=record.employer_name,
            start_date=record.start_date,
            end_date=record.end_date,
            wage_data=record.wage_data,
            position_title=record.position_title
        )
        db.add(db_record)
    
    # Create initial status history
    status_history = schemas.StatusHistory(
        claim_id=db_claim.id,
        status="received",
        change_reason="Initial claim submission",
        changed_by="system"
    )
    db.add(status_history)
    
    db.commit()
    db.refresh(db_claim)
    
    return db_claim


def update_claim_status(
    db: Session, 
    claim_reference_id: str, 
    status_update: pydantic_models.StatusUpdate
) -> schemas.Claim:
    """
    Update a claim's status
    """
    # Get the claim
    claim = get_claim(db, claim_reference_id)
    
    # Update status
    claim.claim_status = status_update.status
    
    # Create status history entry
    status_history = schemas.StatusHistory(
        claim_id=claim.id,
        status=status_update.status,
        change_reason=status_update.reason,
        changed_by=status_update.changed_by
    )
    db.add(status_history)
    
    db.commit()
    db.refresh(claim)
    
    return claim


def get_status_history(db: Session, claim_reference_id: str) -> List[schemas.StatusHistory]:
    """
    Get status history for a claim
    """
    # Get the claim
    claim = get_claim(db, claim_reference_id)
    
    # Get status history
    status_history = db.query(schemas.StatusHistory)\
        .filter(schemas.StatusHistory.claim_id == claim.id)\
        .order_by(schemas.StatusHistory.change_date.desc())\
        .all()
    
    return status_history


def create_claimant(db: Session, claimant: pydantic_models.ClaimantCreate) -> schemas.Claimant:
    """
    Create a new claimant
    """
    # Check if claimant already exists
    existing = db.query(schemas.Claimant).filter(schemas.Claimant.claimant_id == claimant.claimant_id).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Claimant already exists")
    
    # Create new claimant
    db_claimant = schemas.Claimant(
        claimant_id=claimant.claimant_id,
        claimant_name=claimant.claimant_name,
        social_security_number=claimant.social_security_number,
        contact_details=claimant.contact_details.dict()
    )
    
    db.add(db_claimant)
    db.commit()
    db.refresh(db_claimant)
    
    return db_claimant


def get_claimant(db: Session, claimant_id: str) -> schemas.Claimant:
    """
    Get a claimant by ID
    """
    claimant = db.query(schemas.Claimant).filter(schemas.Claimant.claimant_id == claimant_id).first()
    
    if not claimant:
        raise HTTPException(status_code=404, detail="Claimant not found")
    
    return claimant


def get_claim_with_details(db: Session, claim_reference_id: str) -> Dict[str, Any]:
    """
    Get claim with all details (claimant, employment records, status history)
    """
    # Get the claim
    claim = get_claim(db, claim_reference_id)
    
    # Get related details
    employment_records = db.query(schemas.EmploymentRecord)\
        .filter(schemas.EmploymentRecord.claim_id == claim.id)\
        .all()
    
    status_history = db.query(schemas.StatusHistory)\
        .filter(schemas.StatusHistory.claim_id == claim.id)\
        .order_by(schemas.StatusHistory.change_date.desc())\
        .all()
    
    # Get claimant
    claimant = db.query(schemas.Claimant)\
        .filter(schemas.Claimant.claimant_id == claim.claimant_id)\
        .first()
    
    # Combine data
    result = {
        "claim": claim,
        "claimant": claimant,
        "employment_records": employment_records,
        "status_history": status_history
    }
    
    return result


def simulate_processing(db: Session, claim_reference_id: str) -> schemas.Claim:
    """
    Simulate processing a claim (for demo purposes)
    """
    # Get the claim
    claim = get_claim(db, claim_reference_id)
    
    # Update status to processing
    status_update = pydantic_models.StatusUpdate(
        status="processing",
        reason="Automatic processing started",
        changed_by="system"
    )
    
    return update_claim_status(db, claim_reference_id, status_update)


def simulate_employer_wait(db: Session, claim_reference_id: str) -> schemas.Claim:
    """
    Simulate waiting for employer info (for demo purposes)
    """
    # Get the claim
    claim = get_claim(db, claim_reference_id)
    
    # Update status to waiting_for_employer
    status_update = pydantic_models.StatusUpdate(
        status="waiting_for_employer",
        reason="Waiting for employer verification",
        changed_by="system"
    )
    
    return update_claim_status(db, claim_reference_id, status_update){\rtf1}