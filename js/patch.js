// One-time firmware patch for the Mac/iOS tables, done in the browser on the user's own firmware backup.
// Same logic as tools/hi75c_mac_patch.py. Nothing leaves the computer: the file is read and written locally.
//
// Patch v2 (13 bytes, two places):
//  0x04DC  keymap write honours the page byte (LJMP 0x056C → LJMP 0x04EE)
//  0x384B  while Fn is held, look up the Fn table of the current OS mode (0xD000 / 0xD200), not always Windows

export const FW_SIZE = 61440;               // 0x0000–0xEFFF; 0xF000+ is the ISP bootloader and is never written
const PATCHES = [
  [0x04DC, "02056c", "0204ee"],
  [0x384B, "900309e07f0025e0feef2400f582", "900324e0c39402e4f582b33333fe"],
];
// SHA-256 of the stock Hi75C Pro firmware with the bytes sinowisp rewrites on read/write zeroed
// (the reset vector at 0x0001–0x0002 and the jump it keeps at 0xEFFB–0xEFFF).
const STOCK_SHA256 = "97baf1b32ba3769ff059f274c9862b887a4f2027d17e70b13018e32441b01750";
const VOLATILE = [1, 2, 0xEFFB, 0xEFFC, 0xEFFD, 0xEFFE, 0xEFFF];

const fromHex = s => Uint8Array.from(s.match(/../g).map(h => parseInt(h, 16)));
const at = (fw, a, bytes) => bytes.every((b, i) => fw[a + i] === b);

// Intel HEX (as sinowisp writes it) or raw binary → firmware image (first 61440 bytes)
export function parseFirmware(buf) {
  const u8 = new Uint8Array(buf);
  const text = new TextDecoder().decode(u8.slice(0, 1));
  let img;
  if (text === ":") {
    img = new Uint8Array(0x10000).fill(0xFF); let upper = 0;
    for (const line of new TextDecoder().decode(u8).split(/\r?\n/)) {
      if (!line.startsWith(":")) continue;
      const rec = fromHex(line.slice(1).trim());
      if (rec.reduce((a, b) => a + b, 0) & 0xFF) throw new Error("bad checksum");
      const n = rec[0], addr = rec[1] << 8 | rec[2], type = rec[3], data = rec.slice(4, 4 + n);
      if (type === 0) { const a = upper + addr; if (a + n <= img.length) img.set(data, a); }
      else if (type === 4) upper = (data[0] << 8 | data[1]) << 16;
      else if (type === 1) break;
    }
  } else img = u8;
  if (img.length < FW_SIZE) throw new Error("too small");
  return img.slice(0, FW_SIZE);
}

async function sha256(u8) { return [...new Uint8Array(await crypto.subtle.digest("SHA-256", u8))].map(b => b.toString(16).padStart(2, "0")).join(""); }

// → { status: "ok", patched, restore } | { status: "already" } | { status: "unknown" }
export async function makePatch(fw) {
  const P = PATCHES.map(([a, o, n]) => [a, fromHex(o), fromHex(n)]);
  if (P.every(([a, , n]) => at(fw, a, n))) return { status: "already" };
  const base = fw.slice();
  for (const [a, o, n] of P) if (at(base, a, n)) base.set(o, a);      // undo an older (v1) patch
  const norm = base.slice(); VOLATILE.forEach(i => { norm[i] = 0; });
  if (await sha256(norm) !== STOCK_SHA256) return { status: "unknown" };
  const patched = base.slice(); for (const [a, , n] of P) patched.set(n, a);
  return { status: "ok", patched: toIntelHex(patched), restore: toIntelHex(base) };
}

// sinowisp-ready Intel HEX: 16-byte type-00 records + EOF, "\n" line endings, exactly 61440 bytes
export function toIntelHex(fw) {
  const hx = n => n.toString(16).toUpperCase().padStart(2, "0"), lines = [];
  for (let a = 0; a < fw.length; a += 16) {
    const rec = [16, a >> 8 & 255, a & 255, 0, ...fw.slice(a, a + 16)];
    rec.push(-rec.reduce((s, b) => s + b, 0) & 255);
    lines.push(":" + rec.map(hx).join(""));
  }
  lines.push(":00000001FF");
  return lines.join("\n") + "\n";
}
