# Thermal Printer Simple Client

Angular client for operating the Thermal Printer Service.

## Run

From the repository root:

```powershell
pnpm dev:thermal-printer-simple-client
```

The client is available at `http://localhost:4200`,connects to `http://localhost:3000/api` by default.
The API address can be changed on the `Settings` page and is stored in the browser.

Start the API in a separate terminal with `pnpm dev:thermal-printer-service`.

## Other commands

```powershell
pnpm --filter thermal-printer-simple-client build
pnpm --filter thermal-printer-simple-client test
```
