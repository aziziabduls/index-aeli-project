FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY services/program-service/package*.json ./services/program-service/
RUN npm ci --workspace=services/program-service
COPY services/program-service/tsconfig.json ./services/program-service/
COPY services/program-service/src ./services/program-service/src
RUN npm run build --workspace=services/program-service

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY services/program-service/package*.json ./services/program-service/
RUN npm ci --omit=dev --workspace=services/program-service
COPY --from=builder /app/services/program-service/dist ./services/program-service/dist
COPY seed-data.json ./
EXPOSE 7012
CMD ["node", "services/program-service/dist/index.js"]
