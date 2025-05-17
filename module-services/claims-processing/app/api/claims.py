"""
Claims API routes for Claims Processing service
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.schemas.database import get_db
from app.models import models
from app.services import claim_service

router = APIRouter(
    prefix="/api/claims",
    tags=["claims"],
    responses={404: {"description": "Not found"}},
)


@router.get("/{claim_reference_id}", response_model=models.ClaimResponse)
async def get_claim(
    claim_reference_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a claim by reference ID
    """
    return claim_service.get_claim(db, claim_reference_id)


@router.get("/", response_model=List[models.ClaimResponse])
async def get_claims(
    claimant_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get claims with optional filtering
    """
    return claim_service.get_claims(db, claimant_id, status, skip, limit)


@router.post("/", response_model=models.ClaimResponse, status_code=201)
async def create_claim(
    claim: models.ClaimCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new claim
    """
    return claim_service.create_claim(db, claim)


@router.post("/{claim_reference_id}/status", response_model=models.ClaimResponse)
async def update_claim_status(
    claim_reference_id: str,
    status_update: models.StatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a claim's status
    """
    return claim_service.update_claim_status(db, claim_reference_id, status_update)


@router.get("/{claim_reference_id}/history", response_model=List[models.StatusHistoryResponse])
async def get_status_history(
    claim_reference_id: str,
    db: Session = Depends(get_db)
):
    """
    Get status history for a claim
    """
    return claim_service.get_status_history(db, claim_reference_id)


@router.get("/{claim_reference_id}/details")
async def get_claim_details(
    claim_reference_id: str,
    db: Session = Depends(get_db)
):
    """
    Get claim with all details (claimant, employment records, status history)
    """
    return claim_service.get_claim_with_details(db, claim_reference_id)


@router.post("/{claim_reference_id}/simulate/process", response_model=models.ClaimResponse)
async def simulate_processing(
    claim_reference_id: str,
    db: Session = Depends(get_db)
):
    """
    Simulate processing a claim (for demo purposes)
    """
    return claim_service.simulate_processing(db, claim_reference_id)


@router.post("/{claim_reference_id}/simulate/employer-wait", response_model=models.ClaimResponse)
async def simulate_employer_wait(
    claim_reference_id: str,
    db: Session = Depends(get_db)
):
    """
    Simulate waiting for employer info (for demo purposes)
    """
    return claim_service.simulate_employer_wait(db, claim_reference_id)
