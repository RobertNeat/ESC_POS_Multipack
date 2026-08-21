ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-alpine AS build

RUN corepack enable && corepack prepare pnpm@11.17.0 --activate
WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json ./
COPY apps/thermal-printer-simple-client/package.json apps/thermal-printer-simple-client/package.json
RUN pnpm install --frozen-lockfile --filter thermal-printer-simple-client...

COPY apps/thermal-printer-simple-client apps/thermal-printer-simple-client
RUN pnpm --filter thermal-printer-simple-client build

FROM nginx:1.29-alpine AS runtime

RUN apk upgrade --no-cache

COPY apps/thermal-printer-simple-client/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /workspace/apps/thermal-printer-simple-client/dist/thermal-printer-simple-client/browser /usr/share/nginx/html
