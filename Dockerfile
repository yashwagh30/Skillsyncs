# =========================
# Stage 1: Build
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY client ./client
COPY server ./server
COPY shared ./shared
COPY tsconfig.json .
COPY tailwind.config.* .
COPY postcss.config.* .

# Build frontend + backend
RUN npm run build

# =========================
# Stage 2: Production
# =========================
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copy backend build
COPY --from=builder /app/dist ./dist

# 🔴 IMPORTANT: copy frontend build to backend public dir
COPY --from=builder /app/client/dist/public ./dist/public

COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

EXPOSE 5008
CMD ["node", "dist/index.js"]
