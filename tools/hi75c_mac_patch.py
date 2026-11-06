#!/usr/bin/env python3
"""Hi75C Pro — one-time firmware patch that lets the web app write the Mac/iOS keymap tables.

Takes YOUR OWN firmware dump (read with sinowisp) and writes two files next to it:
  <name>-mac-patch.hex   stock firmware + 2-byte patch, ready for `sinowisp write`
  <name>-restore.hex     your original firmware, 61440 bytes (the size sinowisp expects)

The patch: the keymap-write command (06 03) ignores the page byte (byte 4), so writes always land in the
Windows table. Other write commands already add page*0x200 with a shared routine at 0x04EE.
Patch = 0x04DC: LJMP 0x056C -> LJMP 0x04EE (2 bytes). Page 0 behaves exactly as before.

Usage:  python3 hi75c_mac_patch.py dump.hex      (or dump.bin)
"""
import hashlib, os, sys

SIZE = 61440                      # firmware area 0x0000-0xEFFF (0xF000+ is the bootloader: never written)
STOCK_SHA256 = "4a899507249a927b82b0a45d457485869da4f7a12b6ddd33a972dfc5508f8971"
SITE, OLD, NEW = 0x04DC, bytes.fromhex("02056c"), bytes.fromhex("0204ee")

def load(path):
    data = open(path, "rb").read()
    if not data.lstrip().startswith(b":"):
        return bytearray(data)
    img, upper = bytearray(b"\xff" * 0x10000), 0
    for line in data.decode().split():
        rec = bytes.fromhex(line[1:])
        if sum(rec) & 0xFF:
            sys.exit(f"bad checksum in {path}: {line}")
        n, addr, typ, body = rec[0], rec[1] << 8 | rec[2], rec[3], rec[4:4 + rec[0]]
        if typ == 0:
            a = upper + addr
            if a + n <= len(img):
                img[a:a + n] = body
        elif typ == 4:
            upper = (body[0] << 8 | body[1]) << 16
        elif typ == 1:
            break
    return img

def save_hex(path, fw):
    lines = []
    for a in range(0, len(fw), 16):
        c = fw[a:a + 16]
        r = [len(c), a >> 8 & 255, a & 255, 0] + list(c)
        r.append(-sum(r) & 255)
        lines.append(":" + "".join(f"{x:02X}" for x in r))
    lines.append(":00000001FF")
    with open(path, "w", newline="") as f:
        f.write("\n".join(lines) + "\n")

def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = sys.argv[1]
    fw = load(src)
    if len(fw) < SIZE:
        sys.exit(f"{src}: only {len(fw)} bytes, expected at least {SIZE}")
    fw = fw[:SIZE]
    base = os.path.splitext(src)[0]
    if fw[SITE:SITE + 3] == NEW:
        sys.exit("This firmware is already patched. Nothing to do.")
    if hashlib.sha256(fw).hexdigest() != STOCK_SHA256:
        sys.exit("This dump does not match the known Hi75C Pro stock firmware. Not patching.\n"
                 "(Different firmware version, a different keyboard, or a bad read.)")
    save_hex(base + "-restore.hex", fw)
    fw[SITE:SITE + 3] = NEW
    save_hex(base + "-mac-patch.hex", fw)
    print("OK — stock firmware recognised.")
    print(f"  patched : {base}-mac-patch.hex   (2 bytes changed at 0x04DD-0x04DE)")
    print(f"  restore : {base}-restore.hex")
    print("Flash:   sinowisp write -d leobog-hi75c-pro " + os.path.basename(base) + "-mac-patch.hex")

if __name__ == "__main__":
    main()
