# syntax=docker/dockerfile:1.6

FROM node:22-alpine AS builder
WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm ci || npm i

# Build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Runtime image
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080

# Copy only required artifacts
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 8080
CMD ["node", "dist/index.js"]
