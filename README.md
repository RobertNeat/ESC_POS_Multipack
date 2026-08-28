# ESC POS Multipack

Monorepo containing the POS-8370 printer adapter, REST service, and a simple
Angular client.

## Development

Install dependencies once:

```powershell
pnpm install
```

Start the service and client in two separate terminals.

In the first terminal, start the API service:

```powershell
pnpm dev:thermal-printer-service
```

In the second terminal, start the Angular client:

```powershell
pnpm dev:thermal-printer-simple-client
```

The API starts at `http://localhost:3000/api` and the client at
`http://localhost:4200`. Application-specific configuration is documented in
the READMEs under `apps/`.

The development client proxies same-origin `/api` requests to port `3000` by
default. Set `SERVICE_PORT` before starting the client to use a different local
API port.

Production runtime settings are versioned in `deploy/config.env`. The current
endpoints are:

- client: `http://192.168.1.160:10100`
- API: `http://192.168.1.160:10120/api`
- Swagger UI: `http://192.168.1.160:10120/docs`

## Workspace commands

```powershell
pnpm build
pnpm test
pnpm typecheck
pnpm test:ci
```
