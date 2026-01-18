# =========================
# Stage 1: Build frontend
# =========================
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

COPY client/package*.json ./
RUN npm install

COPY client .
RUN npm run build


# =========================
# Stage 2: Build backend
# =========================
FROM node:20-alpine AS backend-builder

WORKDIR /backend

COPY server/package*.json ./
RUN npm install

COPY server .
RUN npm run build


# =========================
# Stage 3: Production
# =========================
FROM node:20-alpine

WORKDIR /app

# Backend
COPY --from=backend-builder /backend/dist ./dist
COPY --from=backend-builder /backend/package*.json ./
RUN npm install --omit=dev

# Frontend (⚠️ THIS FIXES YOUR ISSUE)
COPY --from=frontend-builder /frontend/dist/public ./dist/public

ENV NODE_ENV=production
EXPOSE 5008

CMD ["node", "dist/index.js"]
