<!-- page 20 -->

## `GSBn`

**Name**: Turn white/black reverse printing mode

**Format**

| Encoding | Value     |
| -------- | --------- |
| ASCII    | `GS B n`  |
| Hex      | `1D 42 n` |
| Decimal  | `29 66 n` |

**Range**:

`0 ≤ n ≤ 255`

**Description**:

- Turn white/black reverse printing mode。

- When the `LSB` of `n` is `0`, white/black reverse mode is turned off.

- When the `LSB` of `n` is `1`, white/black reverse mode is turned on.

**Note**:

- Only the lowest bit of `n` is valid.

- This command is available for built-in characters and user-defined characters.

- When white/black reverse printing mode is on, it also applied to characterspacing set by `ESC SP`.

- This command does not affect bit image, user-defined bit image, bar code, HRI characters, and spacing skipped by `HT`, `ESC $`, and `ESC \`.

- This command does not affect the space between lines.

- White/black reverse mode has a higher priority than underline mode. Even if underline mode is on, it is disabled (but not canceled) when white/black reverse mode is selected

**Defaults**: `n=0`
