# syntax=docker/dockerfile:1
# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Build with empty VITE_API_URL to use relative /api in production behind Nginx proxy
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Run stage
FROM nginx:1.27-alpine
# Copy custom Nginx config for SPA and API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]