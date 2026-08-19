<!-- page 11 -->

## `ESC?n`

**Name**: Cancel user-defined characters

**Format**

| Encoding | Value     |
| -------- | --------- |
| ASCII    | `ESC ? n` |
| Hex      | `1B 3F n` |
| Decimal  | `27 63 n` |

**Range**: `32 ≤ n ≤ 126`

**Description**: Cancel user-defined characters

**Note**:

- This command cancels the pattern defined for the character code specified by `n`. After the user-defined characters is canceled, the corresponding pattern for the internal character is printed.

- This command deletes the pattern defined for the specified code in the font selected by `ESC !`.

- If a user-defined character has not been defined for the specified character code, the printer ignores this command.

**Reference**: `ESC&`,`ESC%`
