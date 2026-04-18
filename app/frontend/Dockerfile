# Build stage
FROM node:18.19.1-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm install

COPY . .
RUN npm run build

# Production stage - explicitly use unprivileged image
FROM nginxinc/nginx-unprivileged:1.25-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
