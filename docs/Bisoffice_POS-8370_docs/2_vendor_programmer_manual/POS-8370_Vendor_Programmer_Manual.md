# 80MM THERMAL RECEIPT PRINTER PROGRAMMER MANUAL

---

<!-- page 2 -->

## Format Description :

The programming manual command description includes the following sections:

1） \[Name\] This is the first part of the command descriptions. ASCII code is given command of the form and the function overview of command .

2） \[Format\] This section uses the ASCII coding form, Hex code form, Decimal code form of three kinds of formal description of the command. Which part of the range compared to a decimal number no special instructions, such as in the following example 1 ≤ n ≤ 4, where 1 is a decimal number, rather than the ASCII code table in "1".

3） \[Range\] Gives the allowable ranges for the arguments.

4） \[Description\] Describes the command’s function.

5） \[Detail\] The command notice is given. Because commands in different modes, when with different commands, will lead to mutual influence, and this section gives the details.

6） \[Reference\]Gives the lists of related commands.

```
---> ESC SP n :Transmit real-time status

---> [Format]

| ASCII:   | ESC SP n |
| Hex:     | 1B 20 n  |
| Decimal: | 27 32 n  |

---> [Range] 0 ≤ n≤255
---> [Description] Transmitted in real time specified by the parameter “n” Printer Status：
---> [Detail] Immediately returns the printer associated status after receiving the command.
---> [Reference]
```

---

## Table of Contents

| Command                                       | Description                                                                                                                                   |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| HT                                            | [Horizontal Tab](chapters/1_horizontal_tab.md)                                                                                                |
| LF                                            | [Print and line feed](chapters/2_print_and_line_feed.md)                                                                                      |
| DLEDC4nmt                                     | [Real-time pulse generator](chapters/3_real-time_pulse_generator.md)                                                                          |
| ESCSPn                                        | [Setting the right side character spacing](chapters/4_setting_the_right_side_character_spacing.md)                                            |
| ESC!n                                         | [Select print](chapters/5_select_print.md)                                                                                                    |
| ESC$nLnH                                      | [Set absolute point position](chapters/6_set_absolute_point_position.md)                                                                      |
| ESC%n                                         | [Select/cancel user-defined character set](chapters/7_select-cancel_user-defined_character_set.md)                                            |
| ESC&yc1c2[x1d1...d(y×x1)].. .[xkd1...d(y×xk)] | [Define user-defined characters](chapters/8_define_user-defined_characters.md)                                                                |
| ESC\*mnLnHd1...dk                             | [Select bit-image mode](chapters/9_select_bit-image_mode.md)                                                                                  |
| ESC- n                                        | [Turn underline](chapters/10_turn_underline.md)                                                                                               |
| ESC2                                          | [Select default line](chapters/11_select_default_line.md)                                                                                     |
| ESC3n                                         | [Set line spacing](chapters/12_set_line_spacing.md)                                                                                           |
| ESC?n                                         | [Cancel user-defined characters](chapters/13_cancel_user-defined_characters.md)                                                               |
| ESC@                                          | [Initialize printer](chapters/14_initialize_printer.md)                                                                                       |
| ESCBnt                                        | [Set buzzer](chapters/15_set_buzzer.md)                                                                                                       |
| ESCDn1...nk NUL                               | [Set horizontal tab positions](chapters/16_set_horizontal_tab_positions.md)                                                                   |
| ESCEn                                         | [Turn emphasized mode on/off](chapters/17_turn_emphasized_mode_on-off.md)                                                                     |
| ESCGn                                         | [Turn on/off double-strike mode](chapters/18_turn_on-off_double-strike_mode.md)                                                               |
| ESCJn                                         | [Print and feed paper](chapters/19_print_and_feed_paper.md)                                                                                   |
| ESCMn                                         | [Select character font](chapters/20_select_character_font.md)                                                                                 |
| ESCVn                                         | [Turn 90 degrees clockwise rotation mode on/off](chapters/21_turn_90_degrees_clockwise_rotation_mode_on-off.md)                               |
| ESC\nLnH                                      | [Set relative point position](chapters/22_set_relative_point_position.md)                                                                     |
| ESCan                                         | [Select justification](chapters/23_select_justification.md)                                                                                   |
| ESCc5n                                        | [Enable/disable panel buttons](chapters/24_enable-disable_panel_buttons.md)                                                                   |
| ESCdn                                         | [Print and feed n lines](chapters/25_print_and_feed_n_lines.md)                                                                               |
| ESCpmt1t2                                     | [Generate pulse](chapters/26_generate_pulse.md)                                                                                               |
| ESCtn                                         | [Select character code table](chapters/27_select_character_code_table.md)                                                                     |
| ESC{n                                         | [Turn on/off upside-down printing mode](chapters/28_turn_on-off_upside-down_printing_mode.md)                                                 |
| ESCi                                          | [Part cutter](chapters/29_part_cutter.md)                                                                                                     |
| ESCm                                          | [Partial cut](chapters/30_partial_cut.md)                                                                                                     |
| FSpnm                                         | [Print NV bit image](chapters/31_print_nv_bit_image.md)                                                                                       |
| FSqn[xLxHyL yHd1...dk]1... [xLxHyLyHd1...dk]n | [Define NV bit image](chapters/32_define_nv_bit_image.md)                                                                                     |
| GS!n                                          | [Set character size](chapters/33_set_character_size.md)                                                                                       |
| GSBn                                          | [Turn white/black reverse printing mode](chapters/34_turn_white-black_reverse_printing_mode.md)                                               |
| GSHn                                          | [Select printing position for HRI characters](chapters/35_select_printing_position_for_hri_characters.md)                                     |
| GSLnLnH                                       | [Set left margin](chapters/36_set_left_margin.md)                                                                                             |
| GSVm GSVm n                                   | [Select cut mode and cut paper](chapters/37_select_cut_mode_and_cut_paper.md)                                                                 |
| GSfn                                          | [Select font for Human Readable Interpretation (HRI) characters](chapters/38_select_font_for_human_readable_interpretation_hri_characters.md) |
| GShn                                          | [Setting the bar code height](chapters/39_setting_the_bar_code_height.md)                                                                     |
| GSkmd1...dkNUL GSkmn d1...dn                  | [Print barcode](chapters/40_print_barcode.md)                                                                                                 |
| GSv0mxLxHyLyHd1....dk                         | [Print raster bitmap](chapters/41_print_raster_bitmap.md)                                                                                     |
| GSwn                                          | [Set bar code width](chapters/42_set_bar_code_width.md)                                                                                       |
| GSxn                                          | [Setting the left pitch of Bar Code Printing](chapters/43_setting_the_left_pitch_of_bar_code_printing.md)                                     |
| FS!n                                          | [Set print mode(s) for Hanzi characters](chapters/44_set_print_mode_for_hanzi_characters.md)                                                  |
| FS&                                           | [Select Hanzi character mode](chapters/45_select_hanzi_character_mode.md)                                                                     |
| FS-n                                          | [Turn underline mode on/off for Hanzi characters](chapters/46_turn_underline_mode_onoff_for_hanzi_characters.md)                              |
| FS.                                           | [Cancel Hanzi character mode](chapters/47_cancel_hanzi_character_mode.md)                                                                     |
| FSSn1n2                                       | [Set full-width Hanzi character spacing](chapters/48_set_full-width_hanzi_character_spacing.md)                                               |
| ESCZmn kdLdHd1…dn                             | [Print QR-CODE](chapters/49_print_qr-code.md)                                                                                                 |
| FSWn                                          | [Turn quadruple-size mode on/off for Hanzi characters](chapters/50_turn_quadruple-size_mode_on-off_for_hanzi_characters.md)                   |
| DLE EOT n                                     | [Real-time status transmission](chapters/51_real-time_status_transmission.md)                                                                 |
