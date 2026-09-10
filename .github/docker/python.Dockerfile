ARG RUNTIME_VERSION
FROM python:${RUNTIME_VERSION}-slim
RUN apt-get update \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/*
ARG PROJECT_PATH
ARG APP_PORT
ARG START_COMMAND
ARG IMAGE_TITLE
ARG IMAGE_DESCRIPTION
ARG IMAGE_VENDOR
ARG IMAGE_LICENSES
ARG IMAGE_SOURCE
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY ${PROJECT_PATH}/ ./
ENV START_COMMAND=${START_COMMAND}
LABEL org.opencontainers.image.title="${IMAGE_TITLE}" \
    org.opencontainers.image.description="${IMAGE_DESCRIPTION}" \
    org.opencontainers.image.vendor="${IMAGE_VENDOR}" \
    org.opencontainers.image.licenses="${IMAGE_LICENSES}" \
    org.opencontainers.image.source="${IMAGE_SOURCE}"
EXPOSE ${APP_PORT}
CMD ["sh", "-c", "exec ${START_COMMAND}"]
