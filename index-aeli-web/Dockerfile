# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:7009
ARG NEXT_PUBLIC_TAX_PERCENT=10
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_TAX_PERCENT=$NEXT_PUBLIC_TAX_PERCENT
RUN npm run build

# Run stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=7007
ARG NEXT_PUBLIC_API_URL=http://localhost:7009
ARG NEXT_PUBLIC_TAX_PERCENT=10
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_TAX_PERCENT=$NEXT_PUBLIC_TAX_PERCENT
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 7007
CMD ["npm", "run", "start"]
