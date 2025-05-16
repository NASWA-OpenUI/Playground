# Modules/employer-services/app/__init__.py
from flask import Flask, jsonify, render_template
from flask_cors import CORS
from flask_graphql import GraphQLView
from app.schema import schema
import os

app = Flask(__name__)
CORS(app)

# Register GraphQL endpoint
app.add_url_rule(
    '/graphql',
    view_func=GraphQLView.as_view(
        'graphql',
        schema=schema,
        graphiql=True  # Enable GraphiQL interface for testing
    )
)

# Simple health check endpoint
@app.route('/health')
def health_check():
    return jsonify({"status": "ok"})

# Web interface for employers
@app.route('/')
def index():
    return render_template('index.html')

# Route for listing all pending verification requests
@app.route('/verification-requests')
def verification_requests():
    return render_template('verification_requests.html')

# Route for responding to a specific verification request
@app.route('/verification-requests/<request_id>')
def verification_request_detail(request_id):
    return render_template('verification_form.html', request_id=request_id)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3003))
    app.run(host='0.0.0.0', port=port, debug=True)
