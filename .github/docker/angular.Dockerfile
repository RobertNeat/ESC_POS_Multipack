ARG RUNTIME_VERSION=24
FROM node:${RUNTIME_VERSION}-alpine AS build
RUN apk upgrade --no-cache
ARG PROJECT_PATH
ARG PACKAGE_NAME
WORKDIR /workspace
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile --filter "${PACKAGE_NAME}..." \
    && pnpm --filter "${PACKAGE_NAME}..." build

FROM nginx:1.29-alpine
RUN apk upgrade --no-cache
ARG BUILD_OUTPUT
ARG SERVER_CONFIG
ARG APP_PORT
ARG IMAGE_TITLE
ARG IMAGE_DESCRIPTION
ARG IMAGE_VENDOR
ARG IMAGE_LICENSES
ARG IMAGE_SOURCE
COPY --from=build /workspace/${BUILD_OUTPUT} /usr/share/nginx/html
COPY ${SERVER_CONFIG} /etc/nginx/templates/default.conf.template
LABEL org.opencontainers.image.title="${IMAGE_TITLE}" \
    org.opencontainers.image.description="${IMAGE_DESCRIPTION}" \
    org.opencontainers.image.vendor="${IMAGE_VENDOR}" \
    org.opencontainers.image.licenses="${IMAGE_LICENSES}" \
    org.opencontainers.image.source="${IMAGE_SOURCE}"
EXPOSE ${APP_PORT}
