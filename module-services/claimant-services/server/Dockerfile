FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Make the startup script executable
RUN chmod +x startup.sh

EXPOSE 4000

CMD ["./startup.sh"]