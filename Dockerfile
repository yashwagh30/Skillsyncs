# =========================
# Stage 1: Build
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files first (better cache)
COPY package.json package-lock.json ./

# Configure npm for CI reliability
RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm install --legacy-peer-deps

# Copy source code
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY tsconfig.json ./
COPY vite.config.* ./
COPY tailwind.config.* ./
COPY postcss.config.* ./

# Build frontend + backend
RUN npm run build

# =========================
# Stage 2: Production
# =========================
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copy build output and required files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

# Configure npm again (runtime install can also timeout)
RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm install --omit=dev --legacy-peer-deps

# Expose backend port
EXPOSE 5008

# Start server
CMD ["node", "dist/index.js"]
