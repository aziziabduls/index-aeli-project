FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY services/content-service/package*.json ./services/content-service/
RUN npm ci --workspace=services/content-service
COPY services/content-service/tsconfig.json ./services/content-service/
COPY services/content-service/src ./services/content-service/src
RUN npm run build --workspace=services/content-service

FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY services/content-service/package*.json ./services/content-service/
RUN npm ci --omit=dev --workspace=services/content-service
COPY --from=builder /app/services/content-service/dist ./services/content-service/dist
EXPOSE 7011
CMD ["node", "services/content-service/dist/index.js"]
