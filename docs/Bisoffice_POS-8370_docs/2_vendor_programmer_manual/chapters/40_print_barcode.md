<!-- page 23 -->

# 1. `GSkmd1...dkNUL`

# 2. `GSkmnd1...dn`

**Name**: Print barcode

**Format**

1.  | Encoding | Value                 |
    | -------- | --------------------- |
    | ASCII    | `GS k m d1...dk NUL`  |
    | Hex      | `1D 6B m d1...dk 00`  |
    | Decimal  | `29 107 m d1...dk 0 ` |

2.  | Encoding | Value                |
    | -------- | -------------------- |
    | ASCII    | `GS k m n d1...dn`   |
    | Hex      | `1D 6B m n d1...dn`  |
    | Decimal  | `29 107 m n d1...dn` |

**Range**:

1. `0 ≤ m ≤ 6` (`k` and `d` depends on the bar code system used)

2. `65 ≤ m ≤ 73` (`n` and `d` depends on the bar code system used)

**Description**:

Selects a bar code system and prints the bar code.
m select a bar code system as below：

| version | m   | Bar code system | Number of Characters — 11≤k≤ 12 | Remarks — 48≤ d≤ 57                           |
| ------- | --- | --------------- | ------------------------------- | --------------------------------------------- |
| 1.      | 0   | UPC-A           | 11 ≤ k ≤ 12                     | 48 ≤ d ≤ 57                                   |
|         | 1   | UPC-E           | 11 ≤ k ≤ 12                     | 48 ≤ d ≤ 57                                   |
|         | 2   | JAN13(EAN13)    | 12 ≤ k ≤ 13                     | 48 ≤ d ≤ 57                                   |
|         | 3   | JAN8(EAN8)      | 7 ≤ k ≤ 8                       | 48 ≤ d ≤ 57                                   |
|         | 4   | CODE39          | 1 ≤ k′                          | 48 ≤ d ≤ 57, 65 ≤ d ≤ 90,32,36,37,43,45,46,47 |
|         | 5   | ITF             | 1 ≤ k(even-number)              | 48 ≤ d ≤ 57                                   |
|         | 6   | CODABAR         | 1 ≤ k′                          | 48 ≤ d ≤ 57, 65 ≤ d ≤ 68,36,43,45,46,47,58    |
| -       | -   | -               | -                               | -                                             |
| 2.      | 65  | UPC-A           | 11 ≤ n ≤ 12                     | 48 ≤ d ≤ 57                                   |
|         | 66  | UPC-E           | 11 ≤ n ≤ 12                     | 48 ≤ d ≤ 57                                   |
|         | 67  | JAN13(EAN13)    | 12 ≤ n ≤ 13                     | 48 ≤ d ≤ 57                                   |
|         | 68  | JAN8(EAN8)      | 7 ≤ n ≤ 8                       | 48 ≤ d ≤ 57                                   |
|         | 69  | CODE39          | 1 ≤ n ≤ 255                     | 48 ≤ d ≤ 57,65 ≤ d ≤ 90,32,36,37,43,45,46,47  |
|         | 70  | ITF             | 1 ≤ n ≤ 255(even number)        | 48 ≤ d ≤ 57                                   |
|         | 71  | CODABAR         | 1 ≤ n ≤ 255                     | 48 ≤ d ≤ 57,65 ≤ d ≤ 68,36,43,45,46,47,58     |
|         | 72  | CODE93          | 1 ≤ n ≤ 255                     | 0 ≤ d ≤ 127                                   |
|         | 73  | CODE128         | 2 ≤ n ≤ 255                     | 0 ≤ d ≤ 127                                   |

`[Note 1.]`

- This command ends with a NUL code.

- When the bar code system used is `UPC-A` or `UPC-E`, the printer prints the bar code data after receiving 12 bytes bar code data and processes the following data as normal data.

- When the bar code system used is `JAN13` (`EAN13`), the printer prints the bar code after receiving 13 bytes bar code data and processes the following data as normal data.

- When the bar code system used is `JAN8` (`EAN8`), the printer prints the bar code afterreceiving 8 bytes bar code data and processes the following data as normal data.

- The number of data for `ITF` bar code must be even numbers. When an odd number of datais input, the printer ignores the last received data.

`[Note 2.]`

- `n` indicates the number of bar code data, and the printer processes `n` bytes from the next character data as bar code data.

- If `n` is outside of the specified range, the printer stops command processing and processes the following data as normal data.

`[Notice for standard mode]`

- If `d` is outside of the specified range, the printer only feeds paper and processes the following data as normal data.

- If the horizontal size exceeds printing area, the printer only feeds the paper.

- This command feeds as much paper as is required to print the bar code, regardless of the line spacing specified by `ESC 2` or `ESC 3`.

- This command is enabled only when no data exists in the print buffer. When data exists inthe print buffer, the printer processes the data following `m` as normal data.

- After printing bar code, this command sets the print position to the beginning of the line.

- This command is not affected by print modes (emphasized, double-strike, underline,character size, white/black reverse printing, or 90° rotated character, etc.), except forupside-down printing mode.

  When using a thermal label:
  - If the bar code height is not suitable for the current label, the excess part of the printing on the next label. When using `CODE93` (m = 72):
  - The printer prints an `HRI` character (□) at the beginning of a string of HRI, as the starting `HRI` character string.
  - The printer prints an `HRI` character (□) at the end of the `HRI` character string as a string termination character `HRI`.
    - The printer prints HRI characters (■ + a literal character) as acontrol character (`<00> H` to `<1F> H` and `<7F> H`).
    - When this printer uses `CODE128`, please consider the following factors regarding data transfer:
      - `[1.]` Barcode data string head shall be required to select the character set encoding (`CODEA`, `CODEB`, or `CODEC`), is used to select the code set used first.
    - `[2.]` Combining characters `{` and a character to define the special characters. By continuously transferred twice, `{` is defined ASCII character `{`.

| Special characters | Transmission of data — ASCII | Transmission of data — Hex | Transmission of data — Decimal |
| ------------------ | ---------------------------- | -------------------------- | ------------------------------ |
| `SHIFT`            | `{S`                         | 7B,53                      | 123,83                         |
| `CODEA`            | `{A`                         | 7B,41                      | 123,65                         |
| `CODEB`            | `{B`                         | 7B,42                      | 123,66                         |
| `CODEC`            | `{C`                         | 7B,43                      | 123,67                         |
| `FNC1`             | `{1`                         | 7B,31                      | 123,49                         |
| `FNC2`             | `{2`                         | 7B,32                      | 123,50                         |
| `FNC3`             | `{3`                         | 7B,33                      | 123,51                         |
| `FNC4`             | `{4`                         | 7B,34                      | 123,52                         |
| `{`                | `{{`                         | 7B,7B                      | 123,123                        |

`[Sample]`
Print "No.123456" instance data
In this example,
the printer Print "No." with `CODEB` first,
then printing with `CODEC` following figures: `GS k73 09781114631 32 33 34 35 36`

- If the head of the bar code data string is not coded character set selection, the printer stops command processing, and subsequent data processing as normal data.

- If the combination `{` and subsequent characters do not apply to any special characters, the printer stops command processing, and subsequent data as normal data.

- If the printer receives a specially coded character set can not be used, the printer stops command processing, and subsequent data as normal data.

- The printer does not print and shift characters or code set to select the appropriate character `HRI` characters.

- `HRI` character is the character of the functional spaces.

- Control characters (`<00> H` to `<1F> H` and `<7F> H`) of `HRI` characters are spaces.
  `<Others>` Confirm reservations about barcode spacing. (Depending on the type of pitch is also different barcode)

**Reference**: `GS H`, `GSf`, `GS h`, `GSw`
