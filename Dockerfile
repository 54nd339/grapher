# ----- Stage 1: Build Stage -----
FROM --platform=$BUILDPLATFORM node:24-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

# ----- Stage 2: Production Stage -----
FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
USER node
CMD ["npm", "start"]
