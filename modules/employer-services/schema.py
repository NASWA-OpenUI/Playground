import graphene
from graphql_types import Quarter, Employee, Employer, WageData

# Mock data (same as before)
EMPLOYER_DATA = {
    "Acme Corp": {
        "employer_id": "EMP-001",
        "employees": {
            "1234": {
                "name": "John Doe",
                "quarters": [
                    {"quarter": "Q1-2024", "wages": 12000},
                    {"quarter": "Q2-2024", "wages": 13000},
                    {"quarter": "Q3-2024", "wages": 13500},
                    {"quarter": "Q4-2024", "wages": 14000}
                ]
            },
            "5678": {
                "name": "Jane Smith",
                "quarters": [
                    {"quarter": "Q1-2024", "wages": 15000},
                    {"quarter": "Q2-2024", "wages": 15500},
                    {"quarter": "Q3-2024", "wages": 16000},
                    {"quarter": "Q4-2024", "wages": 16500}
                ]
            }
        }
    },
    "TechCorp": {
        "employer_id": "EMP-002",
        "employees": {
            "9876": {
                "name": "Bob Johnson",
                "quarters": [
                    {"quarter": "Q1-2024", "wages": 20000},
                    {"quarter": "Q2-2024", "wages": 21000},
                    {"quarter": "Q3-2024", "wages": 22000},
                    {"quarter": "Q4-2024", "wages": 23000}
                ]
            }
        }
    }
}

class Query(graphene.ObjectType):
    # Get wage data for a specific employee
    wages = graphene.Field(
        WageData,
        ssn_last4=graphene.String(required=True),
        employer_name=graphene.String(required=True)
    )
    
    # Get all employers
    employers = graphene.List(Employer)
    
    # Get specific employer
    employer = graphene.Field(
        Employer,
        name=graphene.String(required=True)
    )
    
    def resolve_wages(self, info, ssn_last4, employer_name):
        employer_data = EMPLOYER_DATA.get(employer_name)
        if not employer_data:
            # Return default data for demo
            return WageData(
                employer_name=employer_name,
                employee_ssn=ssn_last4,
                quarters=[
                    Quarter(quarter="Q1-2024", wages=10000),
                    Quarter(quarter="Q2-2024", wages=11000),
                    Quarter(quarter="Q3-2024", wages=11500),
                    Quarter(quarter="Q4-2024", wages=12000)
                ],
                total_wages=44500
            )
        
        employee_data = employer_data["employees"].get(ssn_last4)
        if not employee_data:
            # Return default data
            return WageData(
                employer_name=employer_name,
                employee_ssn=ssn_last4,
                quarters=[
                    Quarter(quarter="Q1-2024", wages=10000),
                    Quarter(quarter="Q2-2024", wages=11000),
                    Quarter(quarter="Q3-2024", wages=11500),
                    Quarter(quarter="Q4-2024", wages=12000)
                ],
                total_wages=44500
            )
        
        quarters = [Quarter(quarter=q["quarter"], wages=q["wages"]) 
                   for q in employee_data["quarters"]]
        total_wages = sum(q["wages"] for q in employee_data["quarters"])
        
        return WageData(
            employer_name=employer_name,
            employee_ssn=ssn_last4,
            quarters=quarters,
            total_wages=total_wages
        )
    
    def resolve_employers(self, info):
        employers = []
        for name, data in EMPLOYER_DATA.items():
            employees = []
            for ssn, emp_data in data["employees"].items():
                quarters = [Quarter(quarter=q["quarter"], wages=q["wages"]) 
                           for q in emp_data["quarters"]]
                total_wages = sum(q["wages"] for q in emp_data["quarters"])
                employees.append(Employee(
                    name=emp_data["name"],
                    ssn_last4=ssn,
                    quarters=quarters,
                    total_wages=total_wages
                ))
            
            employers.append(Employer(
                employer_id=data["employer_id"],
                name=name,
                employee_count=len(data["employees"]),
                employees=employees
            ))
        return employers
    
    def resolve_employer(self, info, name):
        data = EMPLOYER_DATA.get(name)
        if not data:
            return None
            
        employees = []
        for ssn, emp_data in data["employees"].items():
            quarters = [Quarter(quarter=q["quarter"], wages=q["wages"]) 
                       for q in emp_data["quarters"]]
            total_wages = sum(q["wages"] for q in emp_data["quarters"])
            employees.append(Employee(
                name=emp_data["name"],
                ssn_last4=ssn,
                quarters=quarters,
                total_wages=total_wages
            ))
            
        return Employer(
            employer_id=data["employer_id"],
            name=name,
            employee_count=len(data["employees"]),
            employees=employees
        )

schema = graphene.Schema(query=Query)
