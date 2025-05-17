"""
Claimants API routes for Claims Processing service
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import models
from app.services import claim_service

router = APIRouter(
    prefix="/api/claimants",
    tags=["claimants"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=models.ClaimantResponse, status_code=201)
async def create_claimant(
    claimant: models.ClaimantCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new claimant
    """
    return claim_service.create_claimant(db, claimant)


@router.get("/{claimant_id}", response_model=models.ClaimantResponse)
async def get_claimant(
    claimant_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a claimant by ID
    """
    return claim_service.get_claimant(db, claimant_id)


@router.get("/{claimant_id}/claims", response_model=List[models.ClaimResponse])
async def get_claimant_claims(
    claimant_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all claims for a claimant
    """
    return claim_service.get_claims(db, claimant_id=claimant_id)