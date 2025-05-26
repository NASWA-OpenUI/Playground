from flask import Flask, render_template, request, jsonify, redirect, url_for
import psycopg2
import psycopg2.extras
import os
import requests
import threading
import time
import logging
from datetime import datetime
import json
from zeep import Client
from zeep.transports import Transport
import urllib3

# Disable SSL warnings for demo purposes
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__)

# Configuration
DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'taxservices'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'password'),
    'port': os.getenv('DB_PORT', '5432')
}

CAMEL_GATEWAY_URL = os.getenv('CAMEL_GATEWAY_URL', 'http://camel-gateway:8080')
SERVICE_NAME = os.getenv('SERVICE_NAME', 'tax-services')
SERVICE_PORT = os.getenv('PORT', '5003')
POLL_INTERVAL = int(os.getenv('POLL_INTERVAL', '10'))  # seconds

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TaxService:
    def __init__(self):
        self.gateway_url = CAMEL_GATEWAY_URL
        self.service_name = SERVICE_NAME
        self.service_port = SERVICE_PORT
        self.is_registered = False
        
    def get_db_connection(self):
        """Get database connection"""
        try:
            conn = psycopg2.connect(**DATABASE_CONFIG)
            return conn
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            return None
    
    def init_database(self):
        """Initialize database tables"""
        conn = self.get_db_connection()
        if not conn:
            return False
            
        try:
            cursor = conn.cursor()
            
            # Create tax_rates table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tax_rates (
                    id SERIAL PRIMARY KEY,
                    state_tax_rate DECIMAL(5,4) DEFAULT 0.0200,
                    federal_tax_rate DECIMAL(5,4) DEFAULT 0.0060,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_by VARCHAR(100) DEFAULT 'system'
                )
            """)
            
            # Create tax_calculations table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tax_calculations (
                    id SERIAL PRIMARY KEY,
                    claim_id VARCHAR(100) UNIQUE NOT NULL,
                    wages DECIMAL(10,2),
                    state_tax_rate DECIMAL(5,4),
                    federal_tax_rate DECIMAL(5,4),
                    state_tax_amount DECIMAL(10,2),
                    federal_tax_amount DECIMAL(10,2),
                    total_tax_amount DECIMAL(10,2),
                    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Insert default tax rates if none exist
            cursor.execute("SELECT COUNT(*) FROM tax_rates")
            if cursor.fetchone()[0] == 0:
                cursor.execute("""
                    INSERT INTO tax_rates (state_tax_rate, federal_tax_rate) 
                    VALUES (0.0200, 0.0060)
                """)
            
            conn.commit()
            logger.info("Database initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            return False
        finally:
            conn.close()
    
    def register_with_gateway(self):
        """Register this service with the camel gateway"""
        registration_data = {
            'serviceId': self.service_name,
            'name': 'Tax Services',
            'technology': 'Python + Flask',
            'protocol': 'SOAP',
            'endpoint': f'http://{self.service_name}:{self.service_port}/soap',
            'healthEndpoint': f'http://{self.service_name}:{self.service_port}/health'
        }
        
        try:
            logger.info(f"Registering with gateway... {registration_data}")
            
            response = requests.post(
                f"{self.gateway_url}/api/services/register",
                json=registration_data,
                timeout=5,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code in [200, 201]:
                self.is_registered = True
                logger.info("✅ Successfully registered with gateway")
                return True
            else:
                logger.warning(f"⚠️ Unexpected response from gateway: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Failed to register with gateway: {e}")
            return False
    
    def send_heartbeat(self):
        """Send heartbeat to gateway"""
        if not self.is_registered:
            return False
            
        try:
            heartbeat_data = {
                'serviceId': self.service_name,
                'timestamp': datetime.now().isoformat(),
                'status': 'UP'
            }
            
            response = requests.post(
                f"{self.gateway_url}/api/services/heartbeat",
                json=heartbeat_data,
                timeout=5,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                logger.info("💓 Heartbeat sent successfully")
                return True
            else:
                logger.warning(f"⚠️ Heartbeat failed with status: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Heartbeat failed: {e}")
            return False
    
    def poll_for_claims(self):
        """Poll camel gateway for claims awaiting tax calculation"""
        try:
            # Use the correct status value from Camel's Claim.java
            status = 'AWAITING_TAX_CALC'
            logger.info(f"Polling for claims with status: {status}")
            
            response = requests.get(
                f"{self.gateway_url}/api/claims/status/{status}",
                timeout=5
            )
            
            if response.status_code == 200:
                claims = response.json()
                logger.info(f"Found {len(claims)} claims with status {status}")
                
                for claim in claims:
                    self.process_claim(claim)
            elif response.status_code == 404:
                logger.warning(f"Claims endpoint not found - may need to add endpoint to Camel gateway")
            else:
                logger.warning(f"Failed to get claims for status {status}: {response.status_code}")
                logger.warning(f"Response body: {response.text}")
                    
        except Exception as e:
            logger.error(f"Failed to poll for claims: {e}")
            # Add more detailed error logging
            import traceback
            logger.error(f"Full error trace: {traceback.format_exc()}")

    def process_claim(self, claim_data):
        """Process a single claim for tax calculation"""
        try:
            # The claim object from Camel will have different field names than what we expected
            # Based on Claim.java, the fields will be camelCase
            claim_id = claim_data.get('claimReferenceId')  # Changed from 'claimId'
            
            # The wage data might be in totalAnnualEarnings or basePeriodQ4
            wages = 0
            if claim_data.get('totalAnnualEarnings'):
                wages = float(claim_data.get('totalAnnualEarnings', 0))
            elif claim_data.get('basePeriodQ4'):
                wages = float(claim_data.get('basePeriodQ4', 0))
            else:
                logger.warning(f"No wage data found for claim {claim_id}")
                return False
            
            logger.info(f"Processing claim {claim_id} with wages ${wages}")
            
            # Get current tax rates
            conn = self.get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            cursor.execute("SELECT * FROM tax_rates ORDER BY updated_at DESC LIMIT 1")
            tax_rates = cursor.fetchone()
            
            if not tax_rates:
                logger.error("No tax rates found")
                return False
            
            # Calculate taxes
            state_rate = float(tax_rates['state_tax_rate'])
            federal_rate = float(tax_rates['federal_tax_rate'])
            
            state_tax = wages * state_rate
            federal_tax = wages * federal_rate
            total_tax = state_tax + federal_tax
            
            # Store calculation
            cursor.execute("""
                INSERT INTO tax_calculations 
                (claim_id, wages, state_tax_rate, federal_tax_rate, 
                 state_tax_amount, federal_tax_amount, total_tax_amount)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (claim_id) DO UPDATE SET
                wages = EXCLUDED.wages,
                state_tax_rate = EXCLUDED.state_tax_rate,
                federal_tax_rate = EXCLUDED.federal_tax_rate,
                state_tax_amount = EXCLUDED.state_tax_amount,
                federal_tax_amount = EXCLUDED.federal_tax_amount,
                total_tax_amount = EXCLUDED.total_tax_amount,
                calculated_at = CURRENT_TIMESTAMP
            """, (claim_id, wages, state_rate, federal_rate, state_tax, federal_tax, total_tax))
            
            conn.commit()
            conn.close()
            
            # Send results back to camel via SOAP
            self.send_tax_results_via_soap(claim_id, {
                'stateTaxAmount': round(state_tax, 2),
                'federalTaxAmount': round(federal_tax, 2),
                'totalTaxAmount': round(total_tax, 2),
                'stateTaxRate': state_rate,
                'federalTaxRate': federal_rate
            })
            
            logger.info(f"Tax calculation completed for {claim_id}: State=${state_tax:.2f}, Federal=${federal_tax:.2f}, Total=${total_tax:.2f}")
            
        except Exception as e:
            logger.error(f"Failed to process claim {claim_data.get('claimReferenceId', 'unknown')}: {e}")
            import traceback
            logger.error(f"Full error trace: {traceback.format_exc()}")
    
    def send_tax_results_via_soap(self, claim_id, tax_data):
        """Send tax calculation results back to camel gateway via SOAP"""
        try:
            # Create SOAP envelope with proper namespace and structure
            soap_body = f"""<?xml version="1.0" encoding="UTF-8"?>

<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <UpdateTaxCalculation xmlns="http://camel-gateway/tax">
            <claimId>{claim_id}</claimId>
            <stateTaxAmount>{tax_data['stateTaxAmount']}</stateTaxAmount>
            <federalTaxAmount>{tax_data['federalTaxAmount']}</federalTaxAmount>
            <totalTaxAmount>{tax_data['totalTaxAmount']}</totalTaxAmount>
            <stateTaxRate>{tax_data['stateTaxRate']}</stateTaxRate>
            <federalTaxRate>{tax_data['federalTaxRate']}</federalTaxRate>
            <calculatedBy>tax-services</calculatedBy>
            <calculatedAt>{datetime.now().isoformat()}</calculatedAt>
        </UpdateTaxCalculation>
    </soap:Body>
</soap:Envelope>"""
            
            headers = {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://camel-gateway/tax/UpdateTaxCalculation'
            }
            
            logger.info(f"Sending SOAP request for claim {claim_id}")
            logger.debug(f"SOAP Body: {soap_body}")  # Add debug logging
            
            response = requests.post(
                f"{self.gateway_url}/soap/tax",
                data=soap_body,
                headers=headers,
                timeout=10
            )
            
            logger.info(f"SOAP Response Status: {response.status_code}")
            logger.debug(f"SOAP Response Body: {response.text}")
            
            if response.status_code == 200:
                logger.info(f"✅ Tax results sent via SOAP for claim {claim_id}")
                return True
            else:
                logger.error(f"❌ SOAP request failed with status {response.status_code}")
                logger.error(f"Response: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to send SOAP request: {e}")
            import traceback
            logger.error(f"Full error trace: {traceback.format_exc()}")
            return False
# Initialize service
tax_service = TaxService()

@app.route('/')
def index():
    """Main dashboard"""
    conn = tax_service.get_db_connection()
    if not conn:
        return "Database connection failed", 500
    
    try:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        # Get current tax rates
        cursor.execute("SELECT * FROM tax_rates ORDER BY updated_at DESC LIMIT 1")
        tax_rates = cursor.fetchone()
        
        # Get recent calculations
        cursor.execute("""
            SELECT * FROM tax_calculations 
            ORDER BY calculated_at DESC 
            LIMIT 10
        """)
        calculations = cursor.fetchall()
        
        return render_template('index.html', 
                             tax_rates=tax_rates, 
                             calculations=calculations)
        
    except Exception as e:
        logger.error(f"Error loading dashboard: {e}")
        return f"Error: {e}", 500
    finally:
        conn.close()

@app.route('/rates', methods=['GET', 'POST'])
def manage_rates():
    """Manage tax rates"""
    if request.method == 'POST':
        try:
            state_rate = float(request.form['state_rate'])
            federal_rate = float(request.form['federal_rate'])
            
            conn = tax_service.get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO tax_rates (state_tax_rate, federal_tax_rate, updated_by)
                VALUES (%s, %s, %s)
            """, (state_rate, federal_rate, 'admin'))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Tax rates updated: State={state_rate}, Federal={federal_rate}")
            return redirect(url_for('index'))
            
        except Exception as e:
            logger.error(f"Failed to update tax rates: {e}")
            return f"Error updating rates: {e}", 500
    
    # GET request - show form
    conn = tax_service.get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute("SELECT * FROM tax_rates ORDER BY updated_at DESC LIMIT 1")
    current_rates = cursor.fetchone()
    conn.close()
    
    return render_template('rates.html', current_rates=current_rates)

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'UP',
        'service': 'tax-services',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/status')
def api_status():
    """API status endpoint"""
    return jsonify({
        'service': 'tax-services',
        'registered': tax_service.is_registered,
        'database': tax_service.get_db_connection() is not None
    })

def background_tasks():
    """Run background tasks (heartbeat and polling)"""
    time.sleep(5)  # Wait for app to start
    
    # Register with gateway
    tax_service.register_with_gateway()
    
    while True:
        try:
            # Send heartbeat
            tax_service.send_heartbeat()
            
            # Poll for claims
            tax_service.poll_for_claims()
            
            time.sleep(POLL_INTERVAL)
            
        except Exception as e:
            logger.error(f"Background task error: {e}")
            time.sleep(POLL_INTERVAL)

if __name__ == '__main__':
    # Initialize database
    if not tax_service.init_database():
        logger.error("Failed to initialize database")
        exit(1)
    
    # Start background tasks
    background_thread = threading.Thread(target=background_tasks, daemon=True)
    background_thread.start()
    
    # Start Flask app
    app.run(host='0.0.0.0', port=int(SERVICE_PORT), debug=True)
