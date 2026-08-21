ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-bookworm-slim AS build

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential python3 libusb-1.0-0-dev libudev-dev \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.17.0 --activate

WORKDIR /workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json ./
COPY apps/thermal-printer-service/package.json apps/thermal-printer-service/package.json
COPY packages/printer-adapter/package.json packages/printer-adapter/package.json
COPY packages/pos-8370-adapter/package.json packages/pos-8370-adapter/package.json
RUN pnpm install --frozen-lockfile

COPY apps/thermal-printer-service apps/thermal-printer-service
COPY packages packages
RUN pnpm --filter @esc-pos-multipack/printer-adapter build \
    && pnpm --filter @esc-pos-multipack/pos-8370-adapter build \
    && pnpm --filter thermal-printer-service build

FROM node:${NODE_VERSION}-bookworm-slim AS runtime

RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends libusb-1.0-0 libudev1 \
    && rm -rf /var/lib/apt/lists/* \
    /opt/yarn-v* \
    /usr/local/lib/node_modules/corepack \
    /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/corepack \
    /usr/local/bin/npm \
    /usr/local/bin/npx \
    /usr/local/bin/pnpm \
    /usr/local/bin/pnpx \
    /usr/local/bin/yarn \
    /usr/local/bin/yarnpkg

ENV NODE_ENV=production
WORKDIR /workspace

COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/apps/thermal-printer-service ./apps/thermal-printer-service
COPY --from=build /workspace/packages ./packages

USER node
WORKDIR /workspace/apps/thermal-printer-service
CMD ["node", "dist/main.js"]
