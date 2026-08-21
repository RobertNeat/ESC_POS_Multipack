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

The API starts at `http://localhost:10120/api` and the client at
`http://localhost:10100`. Both ports are read from the root `.env` file.
Application-specific configuration is documented in
the READMEs under `apps/`.

## Docker

Run the complete application in two containers (client and service):

```powershell
pnpm docker:thermal-printer
```

The client is available at `http://localhost:10100`. Its `/api` requests are
proxied over the Compose network to the service container. The service remains
directly accessible from the host and from other local applications:

- API: `http://localhost:10120/api`
- Swagger UI: `http://localhost:10120/docs`
- OpenAPI: `http://localhost:10120/openapi.json`

Stop and remove the containers with:

```powershell
pnpm docker:thermal-printer:down
```

Printer and port settings can be supplied through the environment. For
example, in PowerShell:

```powershell
$env:PRINTER_HOST = '192.168.1.50'
pnpm docker:thermal-printer
```

The default ports are defined in both `.env` and `.env.example`:

```dotenv
CLIENT_PORT=10100
SERVICE_PORT=10120
```

Compose loads `.env` automatically. The three `pnpm dev:thermal-printer*`
commands load the same file through the workspace development launcher, so a
port change applies consistently to direct and Docker-based runs.

Available Compose variables are `PRINTER_TRANSPORT`, `PRINTER_HOST`,
`PRINTER_PORT`, `PRINTER_TIMEOUT_MS`, `PRINTER_USB_VENDOR_ID`,
`PRINTER_USB_PRODUCT_ID`, `CLIENT_ORIGIN`, `SERVICE_PORT`, and `CLIENT_PORT`.
LAN is the default printer transport. USB passthrough depends on Docker host
support and may require adding the USB device to the service in a local Compose
override.

## Workspace commands

```powershell
pnpm build
pnpm test
```
