# CLAUDE.md — Hi75C Pro remapper (handoff)

Web app (WebHID) to remap keys and set lighting on the **LEOBOG Hi75C Pro** (Sinowealth SH68F90, USB `258a:010c`, 2.4G receiver `3554:fa09`).
Live: https://ghofransalem.github.io/hi75c-remap/ (GitHub Pages from `main`, no build step, plain ES modules).

## Rules (owner preferences)
- Reply in Egyptian Arabic, masculine form. English UI labels/commands on their own lines, never mixed into an Arabic line.
- When the owner must paste code himself: give the full file, not before/after snippets.
- Test in the simulator before pushing; push straight to `main` once tests pass and the owner asked for the change.
- Never put LEOBOG firmware (or anyone's dump) in this public repo. The patch is built from each user's own backup.
- Warn the owner when a chat is getting long so he can ask for a handoff (he's on a weekly usage limit).

## Code map
| File | What |
|---|---|
| `index.html` / `styles.css` | Single page. Stage (mode tabs, layer tabs, keyboard, toolbar) + one wide panel with tabs: Functions, Lighting, Profiles, Key tester, Typing, Mac patch, Log |
| `js/keys.js` | Key codes, LAYOUT (matrix idx = col*6+row, 90 keys), factory tables WIN/MAC, MODES (`win` page 0, `mac` page 1 layers [0,1]) |
| `js/device.js` | WebHID: connect/identify (model 0xA3), keymap read/write, Mac write with stock-firmware detection + restore, `checkMacPatch`, lighting config, 2.4G packets. 2.4G: model check (cmd 05) + keymap read (cmd 41) on connect → `dev.wlOk`; every 2.4G write is read back and repeated (receiver echo ≠ keyboard ack) |
| `js/app.js` | UI state/rendering, profiles (localStorage `hi75c-remap-v6`), tester, typing, patch tab, steps strip |
| `js/i18n.js` | All strings `{en, ar}`; HTML uses `data-i`, `data-i-ph`, `data-i-title` |
| `js/lighting.js` | Lighting config encode/decode |
| `js/typing.js`, `js/texts.js` | Typing tab; texts generated from Taqtaqa by `tools/update-texts.mjs` (ar = Egyptian Arabic, en = English quotes, letters+spaces only) |
| `js/patch.js` | Browser-side firmware patch (same as `tools/hi75c_mac_patch.py`) |

UI invariants: panes share one grid cell (panel height = tallest pane, patch pane scrolls inside), notes/hints have reserved heights → **nothing may change height when switching tabs/modes/language** (owner complained about jumping).

## Protocol (cable, feature report 6, 519 B after id)
Header `[cmd][chunk][00][01][page][len lo][len hi=02]`. `03`/`83` keymap write/read (chunk 0 Default, 1 FN1, 2 FN2, 3 Tap; page 0 Win/Android, 1 Mac/iOS). `04`/`84` config (lighting), `06` self-define colors, `82` query (byte 13 model).
Config read returns flash settings page: `cfg[8+i]` = XDATA `0x0309+i`; **`cfg[35]` = OS mode** (0 Win, 1 Android, 2 Mac, 3 iOS — confirmed on hardware 2026-11-07).

## Firmware facts (stock, from RE)
- Flash tables: Win Default `0xCC00`, Win Fn `0xD000`, Mac Default `0xCE00`, Mac Fn `0xD200`, FN2 `0xD400` (shared), Tap `0xD800`. OS mode var XDATA `0x0324`; readers pick Mac tables with `SUBB A,#2; JC` at `0x388C`, `0x39D7`, `0x3C5C`.
- Keymap write handler `0x04AD` ignored the page → **patch 1** `0x04DC: 02 05 6C → 02 04 EE`.
- Fn lookup checked the Windows Fn table even in Mac mode → **patch 2** at `0x384B` (14 bytes) `900309e07f0025e0feef2400f582 → 900324e0c39402e4f582b33333fe`.
- Owner's keyboard runs **v2** (both patches) and works: Mac Default + FN1 edits OK.
- sinowisp rewrites bytes `0x0001-0x0002` and `0xEFFB-0xEFFF` on read/write → stock check hashes with those zeroed: `97baf1b3…1750`.
- Flash with sinowisp v2.1.0: `sinowisp read|write -d leobog-hi75c-pro file.hex` (61440-byte files only; never write a 64 KB full image).

## Status (2026-11-07)
Done and live: Win/Mac tabs, patch detection memory (`hi75c-mac-patch` = yes/no), OS-mode display, Mac patch tab with 5 steps, key tester, typing, disclaimer, music sync removed.
Verified on hardware 2026-11-07 from a fresh Windows PC: real sinowisp backup → step 3 "already has the patch", step 5 "Patch installed", OS mode bytes Mac=2 / iOS=3.

## Next / open
1. 2.4G writing back on and verified on hardware 2026-11-07 (Windows/Android layers + lighting, read-back verify; keymap read over 2.4G returns 36 packets = 504 B). Firmware: wireless keymap write 0x0884, read 0x3DA0, header parser 0x07D5 (count-1→0x02E2, seq→0x0D10, chunk nibble→0x0389). Mac over 2.4G would need patch C (chunk 4/5 → CE/D2 in 0x0884, 0x095F, 0x3DA0).
2. Unknown flash page `0xC800`/`0xCA00` may hold unit-specific data (2.4G pairing) — reason not to ship one firmware image for everyone.
3. Reddit post / promotion (owner planned).

## Testing
Simulator suite (Playwright + fake WebHID with flash pages, stock/patched modes, dongle, no-HID) is in the separate handoff bundle (`test/`), not in this repo. Run: serve repo with `python3 -m http.server 8765`, then `node suite.mjs`.
