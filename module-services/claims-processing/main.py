"""
Main FastAPI application for Claims Processing service
"""

import os
import time
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.db.database import get_db, engine, Base
from app.api import claims, claimants
from app.schemas import models as schemas

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="Claims Processing API",
    description="REST API for processing unemployment insurance claims",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request processing time middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Include API routers
app.include_router(claims.router)
app.include_router(claimants.router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "name": "Claims Processing API",
        "version": "1.0.0",
        "datetime": datetime.now().isoformat(),
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# Demo data initialization endpoint
@app.post("/init-demo-data")
async def init_demo_data(db: Session = Depends(get_db)):
    """
    Initialize demo data for testing
    """
    # Create demo claimants
    try:
        # Claimant 1
        db.add(schemas.Claimant(
            claimant_id="USER123",
            social_security_number="123-45-6789",
            claimant_name="John Smith",
            contact_details={
                "email": "john.smith@example.com",
                "phone": "555-123-4567",
                "address": {
                    "street": "123 Main St",
                    "city": "Anytown",
                    "state": "CA",
                    "zip": "12345"
                }
            }
        ))
        
        # Claimant 2
        db.add(schemas.Claimant(
            claimant_id="USER456",
            social_security_number="987-65-4321",
            claimant_name="Jane Doe",
            contact_details={
                "email": "jane.doe@example.com",
                "phone": "555-987-6543",
                "address": {
                    "street": "456 Oak Ave",
                    "city": "Somewhere",
                    "state": "NY",
                    "zip": "67890"
                }
            }
        ))
        
        db.commit()
        
        return {"status": "success", "message": "Demo data initialized"}
    
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}