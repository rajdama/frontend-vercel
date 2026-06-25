FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the frontend
RUN npm run build

# Expose the port for the backend server
EXPOSE 5000

# Set environment variables (can be overridden at runtime)
ENV PORT=5000
ENV COMPULIFE_DOMAIN=compulifeapi.com
ENV COMPULIFE_AUTH_ID=760903F14
ENV REMOTE_IP=74.113.157.69
ENV NODE_ENV=production

# Start the server which will serve both the API and the built frontend
CMD ["node", "server.mjs"]