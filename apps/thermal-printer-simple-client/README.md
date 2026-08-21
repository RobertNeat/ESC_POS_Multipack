# Thermal Printer Simple Client

Angular client for operating the Thermal Printer Service.

## Run

From the repository root:

```powershell
pnpm dev:thermal-printer-simple-client
```

The client is available at `http://localhost:4200` and connects through the
same-origin `/api` proxy by default. The development proxy targets
`http://localhost:3000`; set `SERVICE_PORT` to override that port.
The API address can be changed on the `Settings` page and is stored in the browser.

Start the API in a separate terminal with `pnpm dev:thermal-printer-service`.

The gear button in the top bar selects the byte encoding used for text jobs.
Choose the matching pair on both sides, for example Windows-1250 with
`WPC1250 (Latin-2)`, CP852 with `OEM852 (Latin-2)`, or CP3843/Mazovia with
`PC3843 (Polish)`. The browser remembers the selection locally.

## Other commands

```powershell
pnpm --filter thermal-printer-simple-client build
pnpm --filter thermal-printer-simple-client test
```
