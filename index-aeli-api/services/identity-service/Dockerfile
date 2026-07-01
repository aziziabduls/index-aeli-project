FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY services/identity-service/package*.json ./services/identity-service/
RUN npm ci --workspace=services/identity-service
COPY services/identity-service/tsconfig.json ./services/identity-service/
COPY services/identity-service/src ./services/identity-service/src
RUN npm run build --workspace=services/identity-service

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY services/identity-service/package*.json ./services/identity-service/
RUN npm ci --omit=dev --workspace=services/identity-service
COPY --from=builder /app/services/identity-service/dist ./services/identity-service/dist
EXPOSE 7010
CMD ["node", "services/identity-service/dist/index.js"]
