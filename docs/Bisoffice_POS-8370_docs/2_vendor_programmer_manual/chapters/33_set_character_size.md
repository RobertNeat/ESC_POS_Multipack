<!-- page 19 -->

## `GS!n`

**Name**: Set character size

**Format**

| Encoding | Value     |
| -------- | --------- |
| Ascii    | `GS ! n`  |
| Hex      | `1D 21 n` |
| Decimal  | `29 33 n` |

**Range**:

`0 ≤ n ≤ 255`
`1 ≤ vertical_number_of_times ≤ 8`
`1 ≤ horizontal_number_of_times ≤ 8`

**Description**: Selects the character height using bits 0 to 2 and selects the character width using bits 4 to 7, as follows:

| Bit | OFF/ON                                   | Hex  | Decimal | Function |
| --- | ---------------------------------------- | ---- | ------- | -------- |
| 0   | Character height selection. See Table 2. | ->   | ->      | ->       |
| 1   | -\/-                                     | -\/- | -\/-    | -\/-     |
| 2   | -\/-                                     | -\/- | -\/-    | -\/-     |
| 3   | -\/-                                     | -\/- | -\/-    | -\/-     |
| 4   | Character width selection. See Table 1.  | ->   | ->      | ->       |
| 5   | -\/-                                     | -\/- | -\/-    | -\/-     |
| 6   | -\/-                                     | -\/- | -\/-    | -\/-     |
| 7   | -\/-                                     | -\/- | -\/-    | -\/-     |

Table1: Character width selection

| Hex | Decimal | Width           |
| --- | ------- | --------------- |
| 00  | 0       | 1(Normal)       |
| 10  | 16      | 2(Double-width) |
| 20  | 32      | 3               |
| 30  | 48      | 4               |
| 40  | 64      | 5               |
| 50  | 80      | 6               |
| 60  | 96      | 7               |
| 70  | 112     | 8               |

Table 2: Character height selection

| Hex | Decimal | Height           |
| --- | ------- | ---------------- |
| 00  | 0       | 1(Normal)        |
| 01  | 01      | 2(Double-height) |
| 02  | 02      | 3                |
| 03  | 03      | 4                |
| 04  | 04      | 5                |
| 05  | 05      | 6                |
| 06  | 06      | 7                |
| 07  | 07      | 8                |

**Note**:

- This command is all characters (alphanumeric and Kanji) effective except for HRI characters.

- If `n` is outside of the defined range, this command is ignored.

- In standard mode, the vertical direction is the paper feed direction, and the horizontal direction is perpendicular to the paper feed direction. However, when character orientation changes in 90° clockwise rotation mode, the relationship between vertical and horizontal directions is reversed.

- When characters are enlarged with different sizes on one line, all the characters on the line are aligned at the baseline.

- The `ESC !` command can also turn double-width and double-height modes on or off. However, the setting of the last received command is effective.

**Defaults**: `n=0`

**Reference**: `ESC!`
