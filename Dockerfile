# ==========================================
# STAGE 1: Build the App
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

# 1. Copy package files
COPY package*.json ./

# 2. Install Dependencies
RUN npm install --legacy-peer-deps

# 3. Copy Source Code
COPY . .

# 4. Run Build
# This creates client/dist/public (because of your vite.config.ts)
RUN npm run build

# ==========================================
# STAGE 2: Production Runner
# ==========================================
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# 1. Copy node_modules & package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# 2. Copy the Backend Build
COPY --from=builder /app/dist ./dist

# 3. Copy the Frontend Build (CRITICAL FIX HERE)
# We copy from 'client/dist/public' to eliminate the double nesting
COPY --from=builder /app/client/dist/public ./dist/public

# 4. Expose Port
EXPOSE 5008

# 5. Start Command
CMD ["npm", "start"]