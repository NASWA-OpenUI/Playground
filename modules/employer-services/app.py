from flask import Flask, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Mock employer and wage data for demo
EMPLOYER_DATA = {
    "Acme Corp": {
        "employer_id": "EMP-001",
        "employees": {
            "1234": {  # SSN last 4
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

@app.route('/health')
def health_check():
    return jsonify({"status": "Employer Services is running"})

@app.route('/api/wages/<ssn_last4>/<employer_name>')
def get_wages(ssn_last4, employer_name):
    """Get wage data for an employee"""
    try:
        # Find employer
        employer_data = EMPLOYER_DATA.get(employer_name)
        if not employer_data:
            return jsonify({"error": "Employer not found"}), 404
        
        # Find employee
        employee_data = employer_data["employees"].get(ssn_last4)
        if not employee_data:
            # Return default data for demo if employee not found
            employee_data = {
                "name": "Demo Employee",
                "quarters": [
                    {"quarter": "Q1-2024", "wages": 10000},
                    {"quarter": "Q2-2024", "wages": 11000},
                    {"quarter": "Q3-2024", "wages": 11500},
                    {"quarter": "Q4-2024", "wages": 12000}
                ]
            }
        
        # Calculate total wages
        total_wages = sum(q["wages"] for q in employee_data["quarters"])
        
        return jsonify({
            "employerName": employer_name,
            "employeeSSN": ssn_last4,
            "quarters": employee_data["quarters"],
            "totalWages": total_wages
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/employers')
def list_employers():
    """List all employers (for demo purposes)"""
    employers = []
    for name, data in EMPLOYER_DATA.items():
        employers.append({
            "name": name,
            "employer_id": data["employer_id"],
            "employee_count": len(data["employees"])
        })
    return jsonify(employers)

@app.route('/api/employer/<employer_name>')
def get_employer(employer_name):
    """Get details for a specific employer"""
    employer_data = EMPLOYER_DATA.get(employer_name)
    if not employer_data:
        return jsonify({"error": "Employer not found"}), 404
    
    return jsonify({
        "name": employer_name,
        "employer_id": employer_data["employer_id"],
        "employees": list(employer_data["employees"].keys())
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3003))
    app.run(host='0.0.0.0', port=port, debug=True)