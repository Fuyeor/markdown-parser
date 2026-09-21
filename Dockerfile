# /Dockerfile - for build playground to experimental site `flavored.fuyeor.com`
# monorepo/Dockerfile.frontend

# ==========================================
# build @ffm/playground
# ==========================================
FROM node:24-slim AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# prepare depends
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# copy shared package
COPY package/converter/package.json package/converter/
COPY package/formatter/package.json package/formatter/
COPY package/linkify/package.json package/linkify/
COPY package/parser/package.json package/parser/
COPY package/vue-renderer/package.json package/vue-renderer/
COPY playground/package.json playground/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# copy source code
COPY . .

# build linkify before parser consumers resolve its package exports
RUN pnpm --filter @ffm/linkify build
# build parser package before workspace consumers resolve its package exports
RUN pnpm --filter @ffm/parser build

# generate production locale assets before the playground build copies public files
RUN pnpm locale make playground prod

# build playground
RUN pnpm --filter @ffm/playground build

# ==========================================
# release
# ==========================================
FROM nginx:alpine AS runner

# remove default pages
RUN rm -rf /usr/share/nginx/html/*

# copy build artifacts
COPY --from=builder /app/playground/dist /usr/share/nginx/html

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