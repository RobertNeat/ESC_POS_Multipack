ARG RUNTIME_VERSION=24
FROM node:${RUNTIME_VERSION}-alpine AS build
RUN apk upgrade --no-cache \
    && apk add --no-cache eudev-dev g++ linux-headers make python3
ARG PACKAGE_NAME
WORKDIR /workspace
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile \
    && pnpm --filter "${PACKAGE_NAME}..." build \
    && pnpm deploy --filter "${PACKAGE_NAME}" --prod --legacy /opt/app

FROM node:${RUNTIME_VERSION}-alpine
RUN apk upgrade --no-cache \
    && apk add --no-cache eudev-libs \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack
ARG APP_PORT
ARG START_COMMAND
ARG IMAGE_TITLE
ARG IMAGE_DESCRIPTION
ARG IMAGE_VENDOR
ARG IMAGE_LICENSES
ARG IMAGE_SOURCE
WORKDIR /app
COPY --from=build /opt/app ./
ENV START_COMMAND=${START_COMMAND}
LABEL org.opencontainers.image.title="${IMAGE_TITLE}" \
    org.opencontainers.image.description="${IMAGE_DESCRIPTION}" \
    org.opencontainers.image.vendor="${IMAGE_VENDOR}" \
    org.opencontainers.image.licenses="${IMAGE_LICENSES}" \
    org.opencontainers.image.source="${IMAGE_SOURCE}"
USER node
EXPOSE ${APP_PORT}
CMD ["sh", "-c", "exec ${START_COMMAND}"]
