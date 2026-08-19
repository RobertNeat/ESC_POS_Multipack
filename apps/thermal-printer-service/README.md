# Thermal Printer Service

NestJS REST API for the BisOffice POS-8370 adapter. The service serializes
printer jobs and opens the selected `@node-escpos` transport lazily, only when
an endpoint needs the device.

## Run

```powershell
pnpm dev:thermal-printer-service
```

The API is served below `/api`. Swagger UI is available at `/docs`, and the
OpenAPI JSON document at `/openapi.json`.

## Transport configuration

| Environment variable | Default | Description |
| --- | --- | --- |
| `PRINTER_TRANSPORT` | `lan` | `lan` or `usb` |
| `PRINTER_HOST` | `192.168.1.100` | LAN printer address |
| `PRINTER_PORT` | `9100` | RAW printing TCP port |
| `PRINTER_TIMEOUT_MS` | `5000` | Connection/response timeout |
| `PRINTER_USB_VENDOR_ID` | auto | USB VID, decimal or `0x`-prefixed hex |
| `PRINTER_USB_PRODUCT_ID` | auto | USB PID, decimal or `0x`-prefixed hex |
| `PORT` | `3000` | HTTP port |

VID and PID must either both be set or both omitted. In automatic USB mode the
first USB printer-class device found by `@node-escpos/usb-adapter` is used.

## Main endpoints

- `GET /api/printer/capabilities`, `GET /api/printer/status`
- `GET /api/printer/configuration/options`
- `POST /api/printer/configuration`, `/configuration/named`, `/actions`
- `POST /api/printer/raw`, `/lines`, `/markdown`

`POST /api/printer/markdown/text` additionally accepts the Markdown file body
directly with `Content-Type: text/markdown` (or `text/plain`).

The Markdown endpoint intentionally rejects embedded HTML. It supports headings,
paragraphs, nested ordered/unordered/task lists, blockquotes, fenced code,
tables, links, images represented as text, and nested strong/emphasis/strike/code
formatting where the POS-8370 command set has a reasonable equivalent.
