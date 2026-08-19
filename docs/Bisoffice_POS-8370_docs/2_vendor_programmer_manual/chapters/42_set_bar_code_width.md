<!-- page 27 -->

## `GSwn`

**Name**: Set bar code width

**Format**

| Encoding | Value      |
| -------- | ---------- |
| Ascii    | `GS w n`   |
| Hex      | `1D 77 n`  |
| Decimal  | `29 119 n` |

**Range**:
`2 ≤ n ≤ 6`

**Description**:

Set the horizontal size of the bar code.
n set the bar code width as below:

| n   | Module Width (mm)          | Binary-level bar codes    | Binary-level bar codes    |
| --- | -------------------------- | ------------------------- | ------------------------- |
|     | - for Multi-level Bar Code | — Thin element width (mm) | — Thick element width(mm) |
| --- | ------------------------   | ------------------------- | ------------------------- |
| 2   | 0.250                      | 0.250                     | 0.625                     |
| 3   | 0.375                      | 0.375                     | 1.000                     |
| 4   | 0.560                      | 0.500                     | 1.250                     |
| 5   | 0.625                      | 0.625                     | 1.625                     |
| 6   | 0.750                      | 0.750                     | 2.000                     |

- Multi-level bar codes are as follows： `UPC-A`,`UPC-E`,`JAN13(EAN13)`,`JAN8(EAN8)`,`CODE93`,`CODE128`

- Binary-level bar codes are as follows： `CODE39`,`ITF`,`CODABAR`

**Defaults**: `n=3`

**Reference**: `GS k`
