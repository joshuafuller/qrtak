# Multi-stage build optimized for caching and speed
# Stage 1: Dependencies (cached separately from source)
FROM node:25-alpine AS dependencies

WORKDIR /app

# Copy only package files first (most stable layer)
COPY package*.json ./

# Install production dependencies only
# Fix for Rollup issues - use npm install instead of ci
RUN rm -rf node_modules package-lock.json && \
    npm install --omit=dev

# Stage 2: Build dependencies (includes dev deps)
FROM node:25-alpine AS build-dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies including dev (for building)
# This layer is cached when package.json doesn't change
# Fix for Rollup native module issues on different architectures
RUN rm -rf node_modules package-lock.json && \
    npm install && \
    npm cache clean --force

# Stage 3: Builder (source code and build)
FROM node:25-alpine AS builder

# Build arguments
ARG VERSION=dev
ARG BUILD_DATE
ARG VCS_REF

# Add curl for health checks in build stage
RUN apk add --no-cache curl

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=build-dependencies /app/node_modules ./node_modules
COPY package*.json ./

# Copy source code (this layer changes most frequently)
COPY . .

# Build the application
RUN npm run build

# Stage 4: Production base (rarely changes)
FROM nginx:1.29.1-alpine AS production-base

# Install security updates and tools
# This layer is cached unless base image updates
RUN apk update && \
    apk upgrade && \
    apk add --no-cache curl && \
    rm -rf /var/cache/apk/* && \
    # Create non-root user (nginx user already exists)
    adduser -S nginx -u 1001 -G nginx || true && \
    # Setup directories
    mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx

# Stage 5: Final production image
FROM production-base AS production

# Build arguments for labels
ARG VERSION=dev
ARG BUILD_DATE
ARG VCS_REF

# Labels for OCI compliance
LABEL org.opencontainers.image.created=$BUILD_DATE \
      org.opencontainers.image.version=$VERSION \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.title="qrtak" \
      org.opencontainers.image.description="Generate TAK client configuration QR codes instantly" \
      org.opencontainers.image.vendor="TAK Onboarding Platform Team" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.source="https://github.com/joshuafuller/qrtak"

# Set version environment variable
ENV APP_VERSION=$VERSION

# Copy nginx config first (changes less frequently than app code)
COPY nginx.conf /etc/nginx/nginx.conf

# Copy static docs (changes occasionally)
COPY docs /usr/share/nginx/html/docs

# Copy built application (changes most frequently)
COPY --from=builder /app/dist /usr/share/nginx/html

# Create writable packages directory and set ownership
RUN mkdir -p /usr/share/nginx/html/packages && \
    chown -R nginx:nginx /usr/share/nginx/html/packages && \
    chmod -R 775 /usr/share/nginx/html/packages

# Create version file
RUN echo "{\"version\":\"$VERSION\",\"build_date\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > /usr/share/nginx/html/version.json && \
    # Set proper permissions
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Switch to non-root user
USER nginx

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]