import graphene

class Quarter(graphene.ObjectType):
    """Represents wage data for a quarter"""
    quarter = graphene.String()
    wages = graphene.Float()

class Employee(graphene.ObjectType):
    """Represents an employee"""
    name = graphene.String()
    ssn_last4 = graphene.String()
    quarters = graphene.List(Quarter)
    total_wages = graphene.Float()

class Employer(graphene.ObjectType):
    """Represents an employer"""
    employer_id = graphene.String()
    name = graphene.String()
    employee_count = graphene.Int()
    employees = graphene.List(Employee)

class WageData(graphene.ObjectType):
    """Wage data response"""
    employer_name = graphene.String()
    employee_ssn = graphene.String()
    quarters = graphene.List(Quarter)
    total_wages = graphene.Float()
