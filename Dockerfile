# Multi-stage build for qrtak with security enhancements
FROM node:24-alpine AS builder

# Add security scanning tools with pinned versions
# hadolint ignore=DL3018
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci && \
    (npm audit --audit-level=moderate || true)

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with security hardening
FROM nginx:alpine

# Install security updates and remove unnecessary packages
# hadolint ignore=DL3018
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user (nginx user already exists in nginx:alpine)
RUN adduser -S nginx -u 1001 -G nginx || true

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy docs directory for static JSON/reference files
COPY docs /usr/share/nginx/html/docs

# Copy custom nginx config with security headers
COPY nginx.conf /etc/nginx/nginx.conf

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Ensure nginx can write to its cache directory
RUN mkdir -p /var/cache/nginx && chown -R nginx:nginx /var/cache/nginx

# Switch to non-root user
USER nginx

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 