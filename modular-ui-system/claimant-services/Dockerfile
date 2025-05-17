# claimant-services/Dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Add an environment variable to handle React's development server
ENV NODE_ENV=development
ENV WDS_SOCKET_PORT=0

EXPOSE 3000

# Use the React development server
CMD ["npm", "start"]
