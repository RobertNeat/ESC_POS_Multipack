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

## Workspace commands

```powershell
pnpm build
pnpm test
```
