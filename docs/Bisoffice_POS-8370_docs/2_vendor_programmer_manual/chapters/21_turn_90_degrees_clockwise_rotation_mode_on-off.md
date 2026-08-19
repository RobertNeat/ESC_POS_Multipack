<!-- page 13 -->

## `ESCVn`

**Name**: Turn 90° clockwise rotation mode on/off

**Format**

| Encoding | Value     |
| -------- | --------- |
| Ascii    | `ESC V n` |
| Hex      | `1B 56 n` |
| Decimal  | `27 86 n` |

**Range**:
`0 ≤ n ≤ 1`
`48 ≤ n ≤ 49`

**Description**:

Turn 90° clockwise rotation mode on/off `n` is used as below:

| `n`  | Function                              |
| ---- | ------------------------------------- |
| 0,48 | Turns off 90° clockwise rotation mode |
| 1,49 | Turns on 90° clockwise rotation mode  |

**Note**:

- This command affects printing in standard mode. However, the setting is always effective.

- When underline mode is turned `on`, the printer does not underline 90° clockwise-rotated.

- Double-width and double-height commands in 90° rotation mode enlarge characters in the opposite directions from double-height and double width commands in normal mode.

**Defaults**: `n=0`

**Reference**: `ESC!`, `ESC-`
