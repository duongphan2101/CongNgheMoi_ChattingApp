# 1. Build stage
FROM node:23-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --force --legacy-peer-deps
COPY . .
RUN npm run build

# 2. Production stage
FROM node:23-slim

WORKDIR /app

# Copy build files from the builder stage
COPY --from=builder /app/build /app/build

# Install necessary dependencies for production
COPY package*.json ./
RUN npm install --force --legacy-peer-deps

# Expose the port for the application
EXPOSE 3000

# Start the application using Node.js directly
CMD ["npm", "start"]

