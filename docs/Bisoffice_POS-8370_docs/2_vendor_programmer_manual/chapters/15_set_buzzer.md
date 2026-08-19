<!-- page 12 -->

## `ESCBnt`

**Name**: Set buzzer

**Format**

| Encoding | Value       |
| -------- | ----------- |
| Ascii    | `ESC B n t` |
| Hex      | `1B 42 n t` |
| Decimal  | `27 66 n t` |

**Description**:
`1 <= n <= 9`
`1 <= t <= 9`

**Details**:

- The buzzer ring when print the order.

- `n` Refers to the number of buzzer times

- `t` Refers to the buzzer beeps every few hours `(t * 100)` milliseconds.
