"""
Database schemas for Claims Processing service
"""

from sqlalchemy import Column, Integer, String, DECIMAL, Date, ForeignKey, TIMESTAMP, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.schemas.database import Base


class Claimant(Base):
    """
    Claimant table schema
    """
    __tablename__ = "claimants"

    id = Column(Integer, primary_key=True, index=True)
    claimant_id = Column(String(50), unique=True, index=True)
    social_security_number = Column(String(255))
    claimant_name = Column(String(100))
    contact_details = Column(JSON)
    
    # Relationships
    claims = relationship("Claim", back_populates="claimant")


class Claim(Base):
    """
    Claim table schema
    """
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    claim_reference_id = Column(String(15), unique=True, index=True)
    claimant_id = Column(String(50), ForeignKey("claimants.claimant_id"))
    filing_date = Column(TIMESTAMP, server_default=func.now())
    claim_status = Column(String(30), default="received")
    separation_reason = Column(String(50))
    
    # Relationships
    claimant = relationship("Claimant", back_populates="claims")
    employment_records = relationship("EmploymentRecord", back_populates="claim")
    status_history = relationship("StatusHistory", back_populates="claim")


class EmploymentRecord(Base):
    """
    Employment Record table schema
    """
    __tablename__ = "employment_records"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"))
    employer_id = Column(String(20))
    employer_name = Column(String(100))
    start_date = Column(Date)
    end_date = Column(Date)
    wage_data = Column(DECIMAL(12, 2))
    position_title = Column(String(100))
    
    # Relationships
    claim = relationship("Claim", back_populates="employment_records")


class StatusHistory(Base):
    """
    Status History table schema
    """
    __tablename__ = "status_history"

    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(Integer, ForeignKey("claims.id"))
    status = Column(String(30))
    change_date = Column(TIMESTAMP, server_default=func.now())
    change_reason = Column(String(255))
    changed_by = Column(String(50), default="system")
    
    # Relationships
    claim = relationship("Claim", back_populates="status_history")
