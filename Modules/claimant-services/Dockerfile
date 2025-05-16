# Modules/claimant-services/Dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Set the environment variable for React development server to accept all hosts
ENV DANGEROUSLY_DISABLE_HOST_CHECK=true
ENV WDS_SOCKET_HOST=0.0.0.0
ENV WDS_SOCKET_PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
