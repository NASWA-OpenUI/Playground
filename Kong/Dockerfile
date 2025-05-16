# Kong/Dockerfile
FROM kong:3.4

USER root

# Install custom libraries or tools if needed
RUN apt-get update && \
    apt-get install -y curl jq && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy custom configuration
COPY kong.conf /etc/kong/kong.conf

# Set permissions
RUN chmod 777 /etc/kong

USER kong

# Expose ports
EXPOSE 8000 8001 8002 8443 8444

# Command to run Kong with custom configuration
CMD ["kong", "start", "-c", "/etc/kong/kong.conf"]
