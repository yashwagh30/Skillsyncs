# =========================
# Stage 1: Build
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# 1️⃣ Copy ONLY dependency files first (cache friendly)
COPY package.json package-lock.json ./

# 2️⃣ Install deps ONCE
RUN npm ci --legacy-peer-deps

# 3️⃣ Copy rest of the code
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY tsconfig.json .
COPY tailwind.config.* .
COPY postcss.config.* .

# 4️⃣ Build frontend + backend
RUN npm run build


# =========================
# Stage 2: Runtime
# =========================
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copy built app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist/public ./dist/public

# Copy node_modules directly (🔥 no second npm install)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 5008
CMD ["node", "dist/index.js"]
