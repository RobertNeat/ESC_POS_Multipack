<!-- page 3 -->

## `ESCSPn`

**Name**: Setting the right side character spacing

**Format**

| Encoding | Value    |
| -------- | -------- |
| ASCII    | ESC SP n |
| Hex      | 1B 20 n  |
| Decimal  | 27 32 n  |

**Range**: 0≤n≤255

**Description**: Setting the right side character spacing for `[n×0.125 mm]`.

**Note**:

- For the double-width mode, the right side character spacing is double than the normal mode. When the character is magnified, the right side character spacing is n times than the normal mode.

- This command does not affect the setting of Hanzi characters.

- The command to set the value of independent standard mode in each mode.

**Defaults**: `n=0`
