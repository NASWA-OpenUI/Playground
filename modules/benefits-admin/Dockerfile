FROM ruby:3.2-alpine

WORKDIR /app

# Create a simple placeholder
RUN echo "Benefits Admin Module - Coming Soon" > index.html

# Use a simple HTTP server to serve the placeholder
CMD ["ruby", "-run", "-e", "httpd", ".", "-p", "3004"]
