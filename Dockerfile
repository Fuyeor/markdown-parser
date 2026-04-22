# /Dockerfile - for build playground to experimental site `flavored.fuyeor.com`
# monorepo/Dockerfile.frontend

# ==========================================
# build @fuyeor/markdown-parser-playground
# ==========================================
FROM node:24-slim AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# prepare depends
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# copy shared packages
COPY packages/markdown-parser/package.json packages/markdown-parser/
COPY packages/markdown-parser-lit/package.json packages/markdown-parser-lit/
COPY packages/playground/package.json packages/playground/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# copy source code
COPY . .

# build playground
RUN pnpm --filter @fuyeor/markdown-parser-playground build

# ==========================================
# release
# ==========================================
FROM nginx:alpine AS runner

# remove default pages
RUN rm -rf /usr/share/nginx/html/*

# copy build artifacts
COPY --from=builder /app/packages/playground/dist /usr/share/nginx/html

# Nginx config
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { try_files $uri $uri/ /index.html; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]