# Hi75C Pro — Key Remapper

Remap keys and control the lighting on the **LEOBOG Hi75C Pro** straight from the browser. No driver to install, so it works on macOS and Linux too, not only Windows.

**Open it:** https://ghofransalem.github.io/hi75c-remap/

## What it does

- Remap any key on three layers: Default, FN1 (hold Fn) and FN2 (hold a key you set to FN2)
- Key combinations on a single key (for example ⇧⌘4 for a Mac screenshot), with ready-made shortcuts
- Keyboard functions too: media, Bluetooth slots, OS mode, Win lock, lighting controls
- Lighting: the 14 built-in effects with brightness, speed and color, plus Self-define (paint each key)
- Music sync: the keyboard reacts to a browser tab, your screen audio or the microphone
- Profiles you can export and import as text
- Works over the USB cable or the 2.4G receiver (Self-define colors and music sync need the cable)
- English and Arabic interface

## How to use

1. Plug the keyboard in with the USB cable, or plug in its 2.4G receiver and set the switch on the back to 2.4G.
2. Open the page in **Chrome or Edge** on a desktop computer. Safari and Firefox don't support WebHID.
3. Click **Connect keyboard** and choose **Gaming Keyboard** (cable) or the 2.4G receiver.
4. Change keys, then click **Write to keyboard**. Settings are stored on the keyboard itself.

**On a Mac:** the keyboard's built-in Mac mode (Fn+E) ignores custom keymaps. Keep it in Windows mode (Fn+W) and click **Mac layout**, which swaps Win/Alt and puts media keys on the F-row, like Mac mode but with your own changes working.

If anything goes wrong, hold **Fn + Esc** for 3 seconds to restore factory settings, or use the official LEOBOG app.

## How it works

The keyboard (Sinowealth controller, USB `258a:010c`) is configured over HID feature report 6. The protocol was decoded from USB captures of the official LEOBOG ONE app, and every packet this page sends was checked byte-for-byte against those captures:

| Command | What it does |
|---|---|
| `06 03 <chunk>` | Write keymap: 4 × 512 bytes (Default, FN1, FN2, Tap), 4 bytes per key. The Hi75C Pro ignores the Tap layer, so the page doesn't show it |
| `06 83 <chunk>` | Read the keymap back (same layout). The table byte is ignored: the board stores one keymap |
| `06 84` / `06 04` | Read / write the lighting config (effect, brightness, speed, color) |
| `06 06` | Self-define per-key colors |
| `06 08` | Direct per-key colors (used for music sync) |
| `06 82` | Device query; byte 13 is the model (`0xA3` = Hi75C Pro) |

The direct-color format matches OpenRGB's Sinowealth 010C controller.

Over the 2.4G receiver (USB `3554:fa09`) the same payloads travel as 20-byte output reports with ID `0x13`: `[13][cmd][packets][seq][chunk<<4 | len][14 bytes][checksum]`, and the receiver echoes every packet as its acknowledgement. Keymap is `cmd 01`, config read `cmd 44`, config write `cmd 04`.

## Safety and privacy

- The page only asks for the Hi75C Pro (`258a:010c`) or its 2.4G receiver (`3554:fa09`). Over the cable it checks the model ID before it allows any write; over 2.4G the model can't be read, so the write dialog says so.
- Only key codes the app knows can be written. Imported profiles are filtered against that list.
- Everything runs locally in your browser. No server, no analytics, no external requests; fonts are bundled. A strict Content-Security-Policy blocks everything else.
- Audio for music sync is analysed in the page and never recorded or sent anywhere.

## Disclaimer

Unofficial tool, not affiliated with LEOBOG or AULA. Use at your own risk.

Code: MIT License (`LICENSE`). Fonts: IBM Plex Sans, IBM Plex Sans Arabic and IBM Plex Mono, under the SIL Open Font License (`fonts/OFL.txt`).
