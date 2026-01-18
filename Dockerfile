# =========================
# FRONTEND BUILD
# =========================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client .
RUN npm run build


# =========================
# BACKEND BUILD
# =========================
FROM node:20-alpine AS backend-builder
WORKDIR /app/server

COPY server/package*.json ./
RUN npm install

COPY server .
COPY shared ../shared

RUN npm run build


# =========================
# PRODUCTION IMAGE
# =========================
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

# Copy backend build
COPY --from=backend-builder /app/server/dist ./dist
COPY --from=backend-builder /app/server/node_modules ./node_modules
COPY --from=backend-builder /app/server/package.json ./

# Copy frontend build into backend public folder
COPY --from=frontend-builder /app/client/dist ./dist/public

EXPOSE 5008

CMD ["node", "dist/index.js"]
