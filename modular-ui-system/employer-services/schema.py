# employer-services/app/schema.py
import graphene
import requests
import os
from datetime import datetime

# Configuration
API_GATEWAY_URL = os.environ.get('API_GATEWAY_URL', 'http://localhost:3000')

# In-memory data store for employers and verifications
employers = {}
verifications = []

# Types
class Employer(graphene.ObjectType):
    id = graphene.ID(required=True)
    name = graphene.String(required=True)
    address = graphene.String()
    phone = graphene.String()
    email = graphene.String()
    
class Wage(graphene.ObjectType):
    employer_id = graphene.ID(required=True)
    employee_id = graphene.ID(required=True)
    weekly_amount = graphene.Float(required=True)
    start_date = graphene.String()
    end_date = graphene.String()

class Verification(graphene.ObjectType):
    claim_id = graphene.ID(required=True)
    claimant_name = graphene.String()
    employer_name = graphene.String()
    status = graphene.String()
    created_at = graphene.String()
    verified_at = graphene.String()

class VerificationResult(graphene.ObjectType):
    success = graphene.Boolean(required=True)
    message = graphene.String()

# Mutations
class VerifyEmployment(graphene.Mutation):
    class Arguments:
        claim_id = graphene.ID(required=True)
        employee_name = graphene.String(required=True)
        ssn_last4 = graphene.String(required=True)
        employment_dates = graphene.String(required=True)
        weekly_wage = graphene.Float(required=True)

    result = graphene.Field(VerificationResult)
    
    def mutate(self, info, claim_id, employee_name, ssn_last4, employment_dates, weekly_wage):
        # Find verification
        verification = next((v for v in verifications if v.get('claimId') == claim_id), None)
        
        if not verification:
            return VerifyEmployment(
                result=VerificationResult(
                    success=False,
                    message=f"No verification request found for claim ID {claim_id}"
                )
            )
        
        # Update verification status
        verification['status'] = 'Verified'
        verification['verifiedAt'] = datetime.now().isoformat()
        verification['weeklyWage'] = weekly_wage
        
        # Publish event to event bus
        try:
            requests.post(
                f"{API_GATEWAY_URL}/api/events/publish",
                json={
                    'eventName': 'employer.verified',
                    'data': {
                        'claimId': claim_id,
                        'employeeName': employee_name,
                        'ssnLast4': ssn_last4,
                        'employmentDates': employment_dates,
                        'weeklyWage': weekly_wage
                    }
                }
            )
        except Exception as e:
            print(f"Error publishing employer.verified event: {e}")
        
        # Notify claims processing service
        try:
            requests.put(
                f"{API_GATEWAY_URL}/api/claims/{claim_id}",
                json={
                    'employerVerified': True,
                    'employeeName': employee_name,
                    'employmentDates': employment_dates,
                    'weeklyWage': weekly_wage
                }
            )
        except Exception as e:
            print(f"Error updating claim with verification: {e}")
        
        return VerifyEmployment(
            result=VerificationResult(
                success=True,
                message=f"Verification for claim {claim_id} completed successfully"
            )
        )

class RequestVerification(graphene.Mutation):
    class Arguments:
        claim_id = graphene.ID(required=True)
        claimant_name = graphene.String(required=True)

    result = graphene.Field(VerificationResult)
    
    def mutate(self, info, claim_id, claimant_name):
        # Check if verification already exists
        existing = next((v for v in verifications if v.get('claimId') == claim_id), None)
        
        if existing:
            return RequestVerification(
                result=VerificationResult(
                    success=False,
                    message=f"Verification request already exists for claim ID {claim_id}"
                )
            )
        
        # Create new verification request
        verification = {
            'claimId': claim_id,
            'claimantName': claimant_name,
            'status': 'Pending',
            'createdAt': datetime.now().isoformat()
        }
        
        verifications.append(verification)
        
        return RequestVerification(
            result=VerificationResult(
                success=True,
                message=f"Verification request for claim {claim_id} created successfully"
            )
        )

class Mutation(graphene.ObjectType):
    verify_employment = VerifyEmployment.Field()
    request_verification = RequestVerification.Field()

# Queries
class Query(graphene.ObjectType):
    # Get all employers
    employers = graphene.List(Employer)
    
    # Get employer by ID
    employer = graphene.Field(
        Employer, 
        id=graphene.ID(required=True)
    )
    
    # Get all pending verifications
    pending_verifications = graphene.List(Verification)
    
    # Get verification by claim ID
    verification = graphene.Field(
        Verification, 
        claim_id=graphene.ID(required=True)
    )
    
    def resolve_employers(self, info):
        # Convert the employers dictionary to a list of Employer objects
        return [
            Employer(
                id=employer_id,
                name=data.get('name'),
                address=data.get('address'),
                phone=data.get('phone'),
                email=data.get('email')
            )
            for employer_id, data in employers.items()
        ]
    
    def resolve_employer(self, info, id):
        # Get employer by ID
        data = employers.get(id)
        if not data:
            return None
        
        return Employer(
            id=id,
            name=data.get('name'),
            address=data.get('address'),
            phone=data.get('phone'),
            email=data.get('email')
        )
    
    def resolve_pending_verifications(self, info):
        # Convert the verifications list to a list of Verification objects
        return [
            Verification(
                claim_id=v.get('claimId'),
                claimant_name=v.get('claimantName'),
                employer_name=v.get('lastEmployer'),
                status=v.get('status'),
                created_at=v.get('createdAt'),
                verified_at=v.get('verifiedAt')
            )
            for v in verifications
        ]
    
    def resolve_verification(self, info, claim_id):
        # Get verification by claim ID
        verification = next((v for v in verifications if v.get('claimId') == claim_id), None)
        if not verification:
            return None
        
        return Verification(
            claim_id=verification.get('claimId'),
            claimant_name=verification.get('claimantName'),
            employer_name=verification.get('lastEmployer'),
            status=verification.get('status'),
            created_at=verification.get('createdAt'),
            verified_at=verification.get('verifiedAt')
        )

# Create schema
schema = graphene.Schema(query=Query, mutation=Mutation)