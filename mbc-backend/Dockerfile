# syntax=docker/dockerfile:1
FROM node:18-alpine AS base
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Expose API port
EXPOSE 5000

# Ensure upload and logs directories exist
RUN mkdir -p public/uploads logs

# Start the server
CMD ["node", "index.js"]