FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose the port
EXPOSE 3003

# Run the application with gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:3003", "app:app"]