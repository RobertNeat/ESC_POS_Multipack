ARG RUNTIME_VERSION
FROM maven:3.9-eclipse-temurin-${RUNTIME_VERSION} AS build
RUN apt-get update \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/*
ARG PROJECT_PATH
WORKDIR /source
COPY ${PROJECT_PATH}/pom.xml ./pom.xml
RUN mvn --batch-mode dependency:go-offline
COPY ${PROJECT_PATH}/src ./src
RUN mvn --batch-mode package -DskipTests

FROM eclipse-temurin:${RUNTIME_VERSION}-jre
RUN apt-get update \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/*
ARG BUILD_OUTPUT
ARG APP_PORT
ARG START_COMMAND
ARG IMAGE_TITLE
ARG IMAGE_DESCRIPTION
ARG IMAGE_VENDOR
ARG IMAGE_LICENSES
ARG IMAGE_SOURCE
WORKDIR /app
COPY --from=build /source/${BUILD_OUTPUT} ./app.jar
ENV START_COMMAND=${START_COMMAND}
LABEL org.opencontainers.image.title="${IMAGE_TITLE}" \
    org.opencontainers.image.description="${IMAGE_DESCRIPTION}" \
    org.opencontainers.image.vendor="${IMAGE_VENDOR}" \
    org.opencontainers.image.licenses="${IMAGE_LICENSES}" \
    org.opencontainers.image.source="${IMAGE_SOURCE}"
USER 10001
EXPOSE ${APP_PORT}
CMD ["sh", "-c", "exec ${START_COMMAND}"]
