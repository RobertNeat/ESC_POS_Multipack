<!-- page 12 -->

## `ESCEn`

**Name**: Turn emphasized mode on/off

**Format**

| Encoding | Value     |
| -------- | --------- |
| Ascii    | `ESC E n` |
| Hex      | `1B 45 n` |
| Decimal  | `27 69 n` |

**Range**: `0 ≤ n ≤ 255`

**Description**:

- Turn emphasized mode on/off。

- When the `LSB` of `n` is `0`, emphasized mode is turned off.

- When the `LSB` of `n` is `1`, emphasized mode is turned on.

**Note**:

- Only the least significant bit of n is enabled.

- This command and `ESC !` turn on and off emphasized mode in the same way. Be careful when this command is used with `ESC !`.

**Defaults**: `n=0`

**Reference**: `ESC!`
