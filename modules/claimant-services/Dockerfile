FROM node:18-alpine
WORKDIR /app
# Copy package files
COPY package*.json ./
# Install dependencies
RUN npm install
# Copy application files
COPY . .
# Install serve to run the production build
RUN npm install -g serve
# Expose the port
EXPOSE 3000
# Build at runtime with environment variables, then serve
CMD ["sh", "-c", "npm run build && serve -s build -l 3000"]
