FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY services/media-service/package*.json ./services/media-service/
RUN npm ci --workspace=services/media-service
COPY services/media-service/tsconfig.json ./services/media-service/
COPY services/media-service/src ./services/media-service/src
RUN npm run build --workspace=services/media-service

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY services/media-service/package*.json ./services/media-service/
RUN npm ci --omit=dev --workspace=services/media-service
COPY --from=builder /app/services/media-service/dist ./services/media-service/dist
EXPOSE 7013
CMD ["node", "services/media-service/dist/index.js"]
