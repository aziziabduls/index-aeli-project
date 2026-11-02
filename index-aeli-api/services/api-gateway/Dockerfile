FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY services/api-gateway/package*.json ./services/api-gateway/
RUN npm ci --workspace=services/api-gateway
COPY services/api-gateway/tsconfig.json ./services/api-gateway/
COPY services/api-gateway/src ./services/api-gateway/src
RUN npm run build --workspace=services/api-gateway

FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY services/api-gateway/package*.json ./services/api-gateway/
RUN npm ci --omit=dev --workspace=services/api-gateway
COPY --from=builder /app/services/api-gateway/dist ./services/api-gateway/dist
EXPOSE 7009
CMD ["node", "services/api-gateway/dist/index.js"]
