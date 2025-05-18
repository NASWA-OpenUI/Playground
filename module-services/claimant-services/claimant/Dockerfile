FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copy index.html directly
COPY *.html .

# Create a basic favicon
RUN echo '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="8" fill="#3498db"/></svg>' > favicon.ico

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
