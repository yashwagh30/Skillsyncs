# =========================
# Stage 1: Build
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy full project
COPY . .

# Build frontend (Vite)
RUN npm run build:frontend

# Build backend (esbuild)
RUN npm run build

# =========================
# Stage 2: Production
# =========================
FROM node:20-alpine

WORKDIR /app

# Copy only required build output
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

# Install only production deps
RUN npm install --omit=dev --legacy-peer-deps

# App runs on this port
EXPOSE 5008

# Start backend server
CMD ["node", "dist/index.js"]
