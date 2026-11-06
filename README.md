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

**On a Mac:** the keyboard has separate keymap tables for its Mac/iOS mode (Fn+E). Pick the **Mac / iOS** tab to edit them. Writing them needs a one-time firmware patch (see [Mac mode](#about-mac-mode)); without it, keep the keyboard in Windows mode (Fn+W) and use **Mac layout** on the Windows tab.

If anything goes wrong, hold **Fn + Esc** for 3 seconds to restore factory settings, or use the official LEOBOG app.

## How it works

The keyboard (Sinowealth controller, USB `258a:010c`) is configured over HID feature report 6. The protocol was decoded from USB captures of the official LEOBOG ONE app, and every packet this page sends was checked byte-for-byte against those captures:

| Command | What it does |
|---|---|
| `06 03 <chunk> 00 01 <page> 00 02` | Write keymap: 4 × 512 bytes (Default, FN1, FN2, Tap), 4 bytes per key. The Hi75C Pro ignores the Tap layer, so the page doesn't show it. Page 1 (Mac) needs the firmware patch |
| `06 83 <chunk> 00 01 <page> 00 02` | Read the keymap back (same layout). Page 0 = Windows/Android tables, page 1 = Mac/iOS tables |
| `06 84` / `06 04` | Read / write the lighting config (effect, brightness, speed, color) |
| `06 06` | Self-define per-key colors |
| `06 08` | Direct per-key colors (used for music sync) |
| `06 82` | Device query; byte 13 is the model (`0xA3` = Hi75C Pro) |

The direct-color format matches OpenRGB's Sinowealth 010C controller.

Over the 2.4G receiver (USB `3554:fa09`) the same payloads travel as 20-byte output reports with ID `0x13`: `[13][cmd][packets][seq][chunk<<4 | len][14 bytes][checksum]`, and the receiver echoes every packet as its acknowledgement. Keymap is `cmd 01`, config read `cmd 44`, config write `cmd 04`.

## About Mac mode

The keyboard keeps **two families of keymap tables** in flash: Windows/Android (Default `0xCC00`, Fn `0xD000`) and Mac/iOS (Default `0xCE00`, Fn `0xD200`). The firmware picks the Mac family whenever the OS mode is Mac or iOS. FN2 (`0xD400`) is shared by every mode.

Reading both works on stock firmware (byte 4 of the header is the page: `0x200 × page` is added to the table address). Writing does not: the stock keymap-write handler forgets to add the page, so every write lands in the Windows table, which is why the official LEOBOG ONE app can't edit Mac mode either.

### The firmware patch (one time, optional)

A **2-byte patch** makes the write handler use the same "add the page" routine the firmware already uses for its other write commands (`0x04DC: LJMP 0x056C → LJMP 0x04EE`). Page 0 writes behave exactly as before, so LEOBOG ONE keeps working. After the patch, the **Mac / iOS** tab writes the Mac Default and FN1 layers live, over the USB cable.

The repo doesn't ship LEOBOG's firmware. `tools/hi75c_mac_patch.py` patches **your own** dump and refuses anything that isn't the known stock image:

1. Get [sinowisp](https://github.com/carlossless/sinowealth-kb-tool) and dump your firmware with the `leobog-hi75c-pro` profile (`sinowisp read`).
2. `python3 tools/hi75c_mac_patch.py <your-dump>.hex` → writes `<name>-mac-patch.hex` and `<name>-restore.hex` (61440 bytes each).
3. `sinowisp write -d leobog-hi75c-pro <name>-mac-patch.hex`
4. To undo: `sinowisp write -d leobog-hi75c-pro <name>-restore.hex`

Flash only 61440-byte files. A 64 KB image that includes the bootloader fails verification and leaves the keyboard in bootloader mode until you write the 61440-byte restore file.

**Flashing firmware is at your own risk.** The app protects stock keyboards: before writing a Mac table it checks where the write actually landed, and if it hit the Windows table it restores it and stops.

Without the patch:

- **Mac only:** keep the keyboard in Windows mode (Fn+W) and click **Mac layout** on the Windows tab. It recreates Mac mode (Win/Alt swapped, media on the F-row, F1–F12 on Fn, Mission Control and Launchpad on F3/F4) with your own changes working.
- **Android mode** (Fn+Q) reads the Windows table but flips the F-row (media first, F-keys with Fn), and doesn't swap Win/Alt.

Editing the Mac tables over the 2.4G receiver isn't supported yet: the wireless path uses that header byte as a packet counter.

## Safety and privacy

- The page only asks for the Hi75C Pro (`258a:010c`) or its 2.4G receiver (`3554:fa09`). Over the cable it checks the model ID before it allows any write; over 2.4G the model can't be read, so the write dialog says so.
- Only key codes the app knows can be written. Imported profiles are filtered against that list.
- Everything runs locally in your browser. No server, no analytics, no external requests; fonts are bundled. A strict Content-Security-Policy blocks everything else.
- Audio for music sync is analysed in the page and never recorded or sent anywhere.

## Disclaimer

Unofficial tool, not affiliated with LEOBOG or AULA. Use at your own risk.

Code: MIT License (`LICENSE`). Fonts: IBM Plex Sans, IBM Plex Sans Arabic and IBM Plex Mono, under the SIL Open Font License (`fonts/OFL.txt`).
