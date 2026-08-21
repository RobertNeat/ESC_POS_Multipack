# ESC POS Multipack

Monorepo containing the POS-8370 printer adapter, REST service, and a simple
Angular client.

## Development

Install dependencies once:

```powershell
pnpm install
```

Run both applications in parallel:

```powershell
pnpm dev:thermal-printer
```

To run them separately, use two terminals:

```powershell
pnpm dev:thermal-printer-service
pnpm dev:thermal-printer-simple-client
```

The API starts at `http://localhost:3000/api` and the client at
`http://localhost:4200`. Application-specific configuration is documented in
the READMEs under `apps/`.

The development client proxies same-origin `/api` requests to port `3000` by
default. Set `SERVICE_PORT` before starting the client to use a different local
API port.

## Production CI/CD

The repository contains the full Proxmox Docker pipeline chain:

1. **Check** validates the pnpm monorepo (lint, formatting, types, dependency
   vulnerabilities, SAST, tests and build).
2. **Build** creates and scans separate NestJS service and Angular client
   images, then pushes SHA and `latest` tags to `192.168.1.162:5000`.
3. **Deploy** transfers the production Compose definition over SSH and deploys
   the exact immutable SHA to `docker_deploy@192.168.1.160`.

Pushes to `main` start the chain automatically. Each workflow also has a manual
dispatch mode; manual Build accepts an optional commit SHA and manual Deploy
requires the image/commit SHA. The runner uses the labels `self-hosted`,
`Linux`, `X64`, and `production`.

Production runtime settings are versioned in `deploy/config.env`. The current
endpoints are:

- client: `http://192.168.1.160:10100`
- API: `http://192.168.1.160:10120/api`
- Swagger UI: `http://192.168.1.160:10120/docs`

Pipeline structure and runner prerequisites are documented in
`.github/actions/README.md`.

## Workspace commands

```powershell
pnpm build
pnpm test
pnpm typecheck
pnpm test:ci
```
