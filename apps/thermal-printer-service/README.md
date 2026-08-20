# Thermal Printer Service

NestJS REST API for the BisOffice POS-8370 adapter. The service serializes
printer jobs and opens the selected `@node-escpos` transport lazily, only when
an endpoint needs the device.

## Run

```powershell
pnpm dev:thermal-printer-service
```

The API is available at `http://localhost:3000/api`.
Swagger UI is served at `http://localhost:3000/docs`.
The OpenAPI document at `http://localhost:3000/openapi.json`.

## Transport configuration

| Environment variable     | Default         | Description                            |
| ------------------------ | --------------- | -------------------------------------- |
| `PRINTER_TRANSPORT`      | `lan`           | `lan` or `usb`                         |
| `PRINTER_HOST`           | `192.168.1.100` | LAN printer address                    |
| `PRINTER_PORT`           | `9100`          | RAW printing TCP port                  |
| `PRINTER_TIMEOUT_MS`     | `5000`          | Connection/response timeout            |
| `PRINTER_USB_VENDOR_ID`  | auto            | USB VID, decimal or `0x`-prefixed hex  |
| `PRINTER_USB_PRODUCT_ID` | auto            | USB PID, decimal or `0x`-prefixed hex  |
| `PORT`                   | `3000`          | HTTP port                              |
| `CLIENT_ORIGIN`          | all origins     | Comma-separated allowed client origins |

VID and PID must either both be set or both omitted. In automatic USB mode the
first USB printer-class device found by `@node-escpos/usb-adapter` is used.

## Endpoints

- `GET /api/printer/capabilities`, `GET /api/printer/status`
- `GET /api/printer/configuration/options`
- `POST /api/printer/configuration`, `/configuration/named`, `/actions`
- `POST /api/printer/raw`, `/lines`, `/markdown`, `/raster`

`POST /api/printer/markdown/text` accepts a Markdown body with
`Content-Type: text/markdown` or `text/plain`. Embedded HTML is rejected.

Text jobs sent to `/lines` and `/markdown` accept an `encoding` field:
`windows1250`, `cp852`, `cp3843` (Mazovia) or `utf8`. The selected encoding
must match the code page configured in the printer firmware. The JSON API
defaults to `windows1250`; the plain-text Markdown endpoint uses the same
default.
