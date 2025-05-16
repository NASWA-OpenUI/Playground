# Modules/employer-services/app/resolvers.py
import uuid
import json
import requests
from datetime import datetime
import os
from app.models import (
    EmployerVerificationRequest, 
    employers, 
    verification_requests
)

API_GATEWAY_URL = os.environ.get('API_GATEWAY_URL', 'http://localhost:8000')
CLAIMS_PROCESSING_URL = f"{API_GATEWAY_URL}/api/claims"

def get_employer(employer_id):
    for employer in employers:
        if employer.employer_id == employer_id:
            return employer
    return None

def get_verification_requests_for_employer(employer_id):
    return [req for req in verification_requests if req.employer_id == employer_id]

def create_verification_request(claim_id, employer_id, claimant_name, claimant_ssn_last4, start_date, end_date):
    request = EmployerVerificationRequest(
        claim_id,
        employer_id,
        claimant_name,
        claimant_ssn_last4,
        start_date,
        end_date
    )
    verification_requests.append(request)
    return request

def submit_verification_response(request_id, verification_status, employment_details=None, additional_comments=None):
    # Find the verification request
    request = None
    for req in verification_requests:
        if req.request_id == request_id:
            request = req
            break
    
    if not request:
        return False, "Verification request not found"
    
    # Update the request status
    request.status = "Completed"
    request.response = {
        "verificationStatus": verification_status,
        "employmentDetails": employment_details,
        "additionalComments": additional_comments,
        "responseDate": datetime.now().isoformat()
    }
    
    # Notify the Claims Processing service
    try:
        response_data = {
            "employerId": request.employer_id,
            "verificationStatus": verification_status,
            "employmentDetails": employment_details,
            "additionalComments": additional_comments
        }
        
        # For demo purposes, print the notification data
        print(f"Notifying Claims Processing about verification response for claim {request.claim_id}:")
        print(json.dumps(response_data, indent=2))
        
        # In a real implementation, we would call the Claims Processing API
        # url = f"{CLAIMS_PROCESSING_URL}/{request.claim_id}/employer-verification"
        # response = requests.patch(url, json=response_data)
        # if not response.ok:
        #     print(f"Error notifying Claims Processing: {response.status_code} - {response.text}")
        #     return False, "Failed to notify Claims Processing service"
        
        return True, "Verification response submitted successfully"
    except Exception as e:
        print(f"Error notifying Claims Processing: {str(e)}")
        return False, f"Error: {str(e)}"
