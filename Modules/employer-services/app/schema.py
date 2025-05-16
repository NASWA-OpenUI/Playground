# Modules/employer-services/app/schema.py
import graphene
from app.models import (
    EmployerVerificationRequest, 
    employers, 
    verification_requests
)
from app.resolvers import (
    get_employer,
    get_verification_requests_for_employer,
    create_verification_request,
    submit_verification_response
)

# Define GraphQL Types
class EmploymentPeriod(graphene.ObjectType):
    start_date = graphene.String()
    end_date = graphene.String()

class VerificationRequest(graphene.ObjectType):
    request_id = graphene.ID()
    claim_id = graphene.String()
    employer_id = graphene.String()
    claimant_name = graphene.String()
    claimant_ssn_last4 = graphene.String()
    claimed_employment_period = graphene.Field(EmploymentPeriod)
    status = graphene.String()
    request_date = graphene.String()

class EmploymentDetails(graphene.InputObjectType):
    start_date = graphene.String(required=True)
    end_date = graphene.String(required=True)
    wage_rate = graphene.Float(required=True)
    pay_frequency = graphene.String(required=True)
    hours_per_week = graphene.Int()
    reason_for_separation = graphene.String()

class Employer(graphene.ObjectType):
    employer_id = graphene.ID()
    name = graphene.String()
    verification_requests = graphene.List(VerificationRequest)

    def resolve_verification_requests(self, info):
        return get_verification_requests_for_employer(self.employer_id)

# Define Query
class Query(graphene.ObjectType):
    employer = graphene.Field(
        Employer, 
        employer_id=graphene.String(required=True)
    )
    verification_request = graphene.Field(
        VerificationRequest, 
        request_id=graphene.ID(required=True)
    )
    verification_requests = graphene.List(
        VerificationRequest, 
        employer_id=graphene.String(required=True)
    )

    def resolve_employer(self, info, employer_id):
        return get_employer(employer_id)

    def resolve_verification_request(self, info, request_id):
        for request in verification_requests:
            if request.request_id == request_id:
                return request
        return None

    def resolve_verification_requests(self, info, employer_id):
        return get_verification_requests_for_employer(employer_id)

# Define Mutations
class CreateVerificationRequest(graphene.Mutation):
    class Arguments:
        claim_id = graphene.String(required=True)
        employer_id = graphene.String(required=True)
        claimant_name = graphene.String(required=True)
        claimant_ssn_last4 = graphene.String(required=True)
        start_date = graphene.String(required=True)
        end_date = graphene.String(required=True)

    verification_request = graphene.Field(VerificationRequest)

    def mutate(self, info, claim_id, employer_id, claimant_name, claimant_ssn_last4, start_date, end_date):
        verification_request = create_verification_request(
            claim_id, 
            employer_id, 
            claimant_name, 
            claimant_ssn_last4, 
            start_date, 
            end_date
        )
        return CreateVerificationRequest(verification_request=verification_request)

class SubmitVerificationResponse(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        verification_status = graphene.String(required=True)
        employment_details = graphene.Argument(EmploymentDetails, required=False)
        additional_comments = graphene.String()

    success = graphene.Boolean()
    message = graphene.String()

    def mutate(self, info, request_id, verification_status, employment_details=None, additional_comments=None):
        success, message = submit_verification_response(
            request_id, 
            verification_status, 
            employment_details, 
            additional_comments
        )
        return SubmitVerificationResponse(success=success, message=message)

class Mutation(graphene.ObjectType):
    create_verification_request = CreateVerificationRequest.Field()
    submit_verification_response = SubmitVerificationResponse.Field()

# Create Schema
schema = graphene.Schema(query=Query, mutation=Mutation)
