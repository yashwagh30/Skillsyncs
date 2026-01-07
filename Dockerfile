# =========================
# Stage 1: Build
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files first (better cache)
COPY package.json package-lock.json ./

RUN npm install --legacy-peer-deps

# Copy source code only
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY tsconfig.json .
COPY vite.config.* ./
COPY tailwind.config.* ./
COPY postcss.config.* ./

# Build frontend + backend (single command)
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

# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Expose backend port
EXPOSE 5008

# Start server
CMD ["node", "dist/index.js"]
