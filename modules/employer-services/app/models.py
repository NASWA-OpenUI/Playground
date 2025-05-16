# Modules/employer-services/app/models.py
import uuid
from datetime import datetime

# Simulated database models (in-memory for demo)
class EmployerVerificationRequest:
    def __init__(self, claim_id, employer_id, claimant_name, claimant_ssn_last4, start_date, end_date):
        self.request_id = str(uuid.uuid4())
        self.claim_id = claim_id
        self.employer_id = employer_id
        self.claimant_name = claimant_name
        self.claimant_ssn_last4 = claimant_ssn_last4
        self.claimed_employment_period = {
            "start_date": start_date,
            "end_date": end_date
        }
        self.status = "Pending"
        self.request_date = datetime.now().isoformat()
        self.response = None

class Employer:
    def __init__(self, employer_id, name):
        self.employer_id = employer_id
        self.name = name

# Sample data for demo
employers = [
    Employer("EMP12345", "Acme Corporation"),
    Employer("EMP67890", "Globex Industries")
]

# In-memory storage for verification requests
verification_requests = []

# Pre-populate with some sample verification requests
sample_request = EmployerVerificationRequest(
    "C123456",
    "EMP12345",
    "John Doe",
    "1234",
    "2024-01-01",
    "2025-04-15"
)
verification_requests.append(sample_request)
