# ----- Stage 1: Build Stage -----
FROM --platform=$BUILDPLATFORM oven/bun:latest AS builder

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# ----- Stage 2: Serve Stage -----
FROM nginx:stable-alpine AS runner

COPY --from=builder /app/out /usr/share/nginx/html

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]