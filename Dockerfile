FROM node:22.17.0-alpine AS builder

WORKDIR /app

COPY package*.json package-lock.json* ./
# install system deps needed to compile native modules (Prisma/runtime may need openssl etc.)
RUN apk add --no-cache build-base python3 openssl-dev musl-dev libc6-compat linux-headers

# install all node deps for build
RUN npm ci --prefer-offline

COPY . .
RUN npm run build

FROM node:22.17.0-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json package-lock.json* ./
RUN npm ci --omit=dev --prefer-offline

COPY --from=builder /app/dist ./dist

EXPOSE 3000

USER node

CMD ["node", "dist/main.js"]
