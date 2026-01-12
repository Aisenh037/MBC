# syntax=docker/dockerfile:1

# ==============================================
# Build Stage
# ==============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY vitest.config.ts ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_AI_SERVICE_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Set environment variables for build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_AI_SERVICE_URL=${VITE_AI_SERVICE_URL}
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

# Type check and build
RUN npm run type-check
RUN npm run build

# ==============================================
# Production Stage
# ==============================================
FROM nginx:1.27-alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nginx-group && \
    adduser -S nginx-user -u 1001 -G nginx-group

# Set proper permissions
RUN chown -R nginx-user:nginx-group /usr/share/nginx/html && \
    chown -R nginx-user:nginx-group /var/cache/nginx && \
    chown -R nginx-user:nginx-group /var/log/nginx && \
    chown -R nginx-user:nginx-group /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-group /var/run/nginx.pid

# Switch to non-root user
USER nginx-user

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80 || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]