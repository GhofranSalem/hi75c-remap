// WebHID protocol for the LEOBOG Hi75C Pro (Sinowealth 258a:010c) and its 2.4G receiver (3554:fa09).
// Decoded from LEOBOG ONE USB captures and the firmware (see README).
//
// Cable: HID feature report 6, 520 bytes incl. id. Header after the id:
//   [cmd][chunk][00][01][page][len lo][len hi]
//   03/83 keymap write/read (chunk 0 Default, 1 FN1, 2 FN2, 3 Tap; page 0 Windows/Android, 1 Mac/iOS)
//   04/84 config write/read (lighting)   06 self-define colors   08 direct colors   82 device query (byte 13 = model)
// 2.4G: output/input report 0x13, 20 bytes [13][cmd][packets][seq][chunk<<4|len][14 data][checksum];
//   the receiver echoes every packet as its ack. cmd 01 keymap, 04 config write, 44 config read.

import { h2 } from "./keys.js";

const WIRED = { vendorId: 0x258a, productId: 0x010c };
const DONGLE = { vendorId: 0x3554, productId: 0xfa09 };
const MODEL_HI75C_PRO = 0xA3;
// Writing over the 2.4G receiver is switched off until it is reliable. Reading still works.
export const WIRELESS_WRITE = false;

export const sleep = ms => new Promise(r => setTimeout(r, ms));
const sameBytes = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const hdr = b => [...b.slice(0, 7)].map(h2).join(" ");

let log = () => {};
export const dev = { devices: [], cfg: null, wireless: false, product: null };
export const canWrite = () => !!dev.cfg && (!dev.wireless || WIRELESS_WRITE);

// ---------- channel lock: keymap/lighting transfers pause music frames ----------
let exclusive = false, sendingFrame = false;
export async function exclusively(fn) {
  exclusive = true;
  while (sendingFrame) await sleep(10);
  try { return await fn(); } finally { exclusive = false; }
}

// ---------- connect ----------
export function init({ onLog, onDisconnect }) {
  log = onLog;
  navigator.hid?.addEventListener("disconnect", e => {
    if (!dev.devices.includes(e.device)) return;
    Object.assign(dev, { devices: [], cfg: null, wireless: false, product: null });
    log("disconnected"); onDisconnect();
  });
}

// Returns {ok, wrongModel}
export async function connect() {
  const picked = await navigator.hid.requestDevice({ filters: [WIRED, DONGLE] });
  if (!picked.length) return { ok: false };
  const p = picked[0];
  dev.wireless = p.vendorId === DONGLE.vendorId;
  dev.product = p; dev.cfg = null;
  dev.devices = (await navigator.hid.getDevices()).filter(d => d.vendorId === p.vendorId && d.productId === p.productId);
  for (const d of dev.devices) {
    if (!d.opened) { try { await d.open(); } catch (e) { log("open failed: " + e.message); } }
    const has = (kind, id) => d.collections.some(c => (c[kind] || []).some(r => r.reportId === id));
    if (dev.wireless ? has("outputReports", 0x13) : has("featureReports", 6)) dev.cfg = d;
    d.oninputreport = ev => { if (ev.reportId === 0x13) onDongleReport(ev); };
    d.collections.forEach(c => log(`HID collection ${hex4(c.usagePage)}:${hex4(c.usage)} in [${ids(c.inputReports)}] feature [${ids(c.featureReports)}]`));
  }
  if (!dev.cfg) { log("Config channel not found — wrong device?"); return { ok: true }; }
  if (dev.wireless) { log("2.4G receiver connected. The model can't be checked over 2.4G." + (WIRELESS_WRITE ? "" : " Writing over 2.4G is turned off for now.")); return { ok: true }; }
  const model = await identify().catch(e => { log("identify failed: " + e.message); return -1; });
  log("model id: " + (model < 0 ? "unknown" : "0x" + h2(model)));
  if (model >= 0 && model !== MODEL_HI75C_PRO) { dev.cfg = null; log("Not a Hi75C Pro (expected 0xa3). Writing disabled."); return { ok: true, wrongModel: true }; }
  return { ok: true };
}
const hex4 = n => "0x" + n.toString(16).padStart(4, "0");
const ids = a => (a || []).map(r => r.reportId).join(",") || "–";

// ---------- wired feature-report helpers ----------
async function query(header, wantCmd) {
  const req = new Uint8Array(519); req.set(header);
  await dev.cfg.sendFeatureReport(6, req); await sleep(60);
  const dv = await dev.cfg.receiveFeatureReport(6);
  let b = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);
  if (b[0] === wantCmd) { const t = new Uint8Array(b.length + 1); t[0] = 6; t.set(b, 1); b = t; }   // some OSes strip the report id
  if (b[0] !== 6 || b[1] !== wantCmd) throw new Error(`unexpected reply to ${h2(wantCmd)}: ${[...b.slice(0, 8)].map(h2).join(" ")}`);
  return b;
}
async function identify() { const b = await query([0x82, 0x01, 0x00, 0x01, 0x00, 0x06, 0x00], 0x82); return b.length > 13 ? b[13] : -1; }

// ---------- keymap ----------
export function keymapPacket(chunk, page, entries) {        // entries: Uint32 values, written from index 0
  const buf = new Uint8Array(519);
  buf.set([0x03, chunk, 0x00, 0x01, page, 0x00, 0x02]);
  entries.forEach((v, i) => { const o = 7 + 4 * i; buf[o] = v >>> 24; buf[o + 1] = v >>> 16 & 255; buf[o + 2] = v >>> 8 & 255; buf[o + 3] = v & 255; });
  buf[517] = 0x5a; buf[518] = 0xa5;
  return buf;
}
async function readKeymapRaw(chunk, page) {
  const b = await query([0x83, chunk, 0x00, 0x01, page, 0x00, 0x02], 0x83);
  if (b[2] !== chunk || b.length < 520) throw new Error("short keymap reply");
  return b.slice(8, 520);                                    // 512 data bytes, same layout as a write
}
export async function readKeymap(chunk, page, count) {
  const b = await readKeymapRaw(chunk, page);
  return Array.from({ length: count }, (_, i) => ((b[4 * i] << 24) | (b[4 * i + 1] << 16) | (b[4 * i + 2] << 8) | b[4 * i + 3]) >>> 0);
}

// packets: Map chunk -> 519-byte packet. Returns {ok:true} or {ok:false, stock:true, restored:bool}.
export async function writeKeymap(page, packets) {
  if (!canWrite()) throw new Error("writing over 2.4G is disabled");
  if (page === 0) {
    for (const [c, buf] of packets) {
      if (dev.wireless) await wlWriteBlock(0x01, c, buf.slice(7)); else await dev.cfg.sendFeatureReport(6, buf);
      log(`SET keymap: 06 ${hdr(buf)} …`); await sleep(90);
    }
    return { ok: true };
  }
  return writeMacTables(page, packets);
}

// Mac/iOS tables: only a patched firmware honours the page on writes; stock firmware writes the Windows table.
// So back up the Windows Default, write, check where it landed, and on stock firmware restore and stop.
async function writeMacTables(page, packets) {
  const send = async buf => { await dev.cfg.sendFeatureReport(6, buf); log(`SET keymap: 06 ${hdr(buf)} …`); await sleep(250); };
  const win0 = await readKeymapRaw(0, 0);
  for (const [c, buf] of packets) {
    await send(buf);
    if (!sameBytes(await readKeymapRaw(0, 0), win0)) {
      log("The Windows table changed → stock firmware. Restoring the Windows Default layer…");
      const fix = new Uint8Array(519); fix.set([0x03, 0, 0x00, 0x01, 0x00, 0x00, 0x02]); fix.set(win0, 7); await send(fix);
      const restored = sameBytes(await readKeymapRaw(0, 0), win0);
      log(restored ? "Windows Default restored ✓" : "Restore did not verify — hold Fn+Esc for 3 seconds to factory reset.");
      return { ok: false, stock: true, restored };
    }
    if (!sameBytes(await readKeymapRaw(c, page), buf.slice(7))) throw new Error(`Mac layer ${c} did not verify after writing`);
  }
  return { ok: true };
}

// ---------- lighting config ----------
// The config read returns the settings page from flash: cfg[8+i] mirrors XDATA 0x0309+i.
// cfg[35] = XDATA 0x0324 = current OS mode (0 Windows, 1 Android, 2 Mac, 3 iOS; ≥2 uses the Mac tables).
export const OS_MODE_BYTE = 35;
export async function readOsMode() { const c = await readConfig(); return c[OS_MODE_BYTE]; }
export async function readConfig() {
  if (dev.wireless) return wlReadConfig();
  return (await query([0x84, 0, 0, 0x01, 0, 0x80, 0x00], 0x84)).slice(0, 136);
}
export async function writeConfig(out) {                     // out: 520 bytes incl. id
  if (!canWrite()) throw new Error("writing over 2.4G is disabled");
  if (dev.wireless) await wlWriteBlock(0x04, 0, out.slice(8, 136)); else await dev.cfg.sendFeatureReport(6, out.slice(1));
}
export async function writeSelfDefine(keys) {               // keys: {index: [r,g,b]}, planar R[126] G[126] B[126]
  if (dev.wireless) throw new Error("Self-define colors need the USB cable");
  const out = new Uint8Array(519); out.set([0x06, 0, 0, 0x01, 0, 0x7a, 0x01]);
  for (let i = 0; i < 126; i++) { const c = keys[i] || [0, 0, 0]; out[7 + i] = c[0]; out[133 + i] = c[1]; out[259 + i] = c[2]; }
  await dev.cfg.sendFeatureReport(6, out); await sleep(80);
}

// ---------- direct colors (music sync); the keyboard falls back to its own effect ~1 s after the last frame ----------
export async function sendDirect(cols) {                    // cols: Array(126) of [r,g,b] | null
  if (!dev.cfg || dev.wireless || sendingFrame || exclusive) return;
  const out = new Uint8Array(519); out.set([0x08, 0, 0, 0x01, 0, 0x7a, 0x01]);
  for (let i = 0; i < 126; i++) { const c = cols[i] || [0, 0, 0]; out.set(c, 7 + 3 * i); }
  sendingFrame = true;
  try { await dev.cfg.sendFeatureReport(6, out); } finally { sendingFrame = false; }
}

// ---------- 2.4G receiver ----------
let rxWaiters = [];
function onDongleReport(ev) {
  const b = new Uint8Array(ev.data.buffer, ev.data.byteOffset, ev.data.byteLength);
  const pkt = new Uint8Array(20); pkt[0] = 0x13; pkt.set(b.slice(0, 19), 1);
  rxWaiters.slice().forEach(w => w(pkt));
}
export function wlPacket(cmd, count, seq, lenByte, data) {
  const p = new Uint8Array(20); p.set([0x13, cmd, count, seq, lenByte]);
  if (data) p.set(data.slice(0, 14), 5);
  let sum = 0; for (let i = 0; i < 19; i++) sum += p[i]; p[19] = sum & 255;
  return p;
}
function wlWait(match, ms) {
  return new Promise(res => {
    const w = pkt => { if (match(pkt)) done(true); };
    const done = v => { clearTimeout(t); rxWaiters = rxWaiters.filter(x => x !== w); res(v); };
    const t = setTimeout(() => done(false), ms); rxWaiters.push(w);
  });
}
async function wlSendAck(p) {
  for (let a = 0; a < 4; a++) {
    const ack = wlWait(r => r[1] === p[1] && r[3] === p[3] && r[19] === p[19], 400);
    await dev.cfg.sendReport(0x13, p.slice(1));
    if (await ack) return;
  }
  throw new Error(`no ack from receiver (cmd ${h2(p[1])} packet ${p[3]})`);
}
async function wlWriteBlock(cmd, chunk, bytes) {
  if (!WIRELESS_WRITE) throw new Error("writing over 2.4G is disabled");
  const n = Math.ceil(bytes.length / 14);
  for (let i = 0; i < n; i++) { const part = bytes.slice(i * 14, i * 14 + 14); await wlSendAck(wlPacket(cmd, n, i, (chunk << 4) | part.length, part)); }
}
async function wlReadConfig() {
  for (let a = 0; a < 6; a++) {
    const got = {}; let total = 10;
    const w = r => { if (r[1] === 0x44 && r[2] > 0) { total = r[2]; got[r[3]] = r.slice(5, 5 + (r[4] & 15)); } };
    rxWaiters.push(w);
    await dev.cfg.sendReport(0x13, wlPacket(0x44, 1, 0, 0, null).slice(1));
    for (let t = 0; t < 30 && Object.keys(got).length < total; t++) await sleep(20);
    rxWaiters = rxWaiters.filter(x => x !== w);
    if (Object.keys(got).length >= total) {
      const cfg = new Uint8Array(136); cfg.set([0x06, 0x84, 0, 0, 0x01, 0, 0x80, 0x00]); let o = 8;
      for (let i = 0; i < total; i++) { cfg.set(got[i].slice(0, 136 - o), o); o += got[i].length; }
      return cfg;
    }
    log(`config read incomplete (${Object.keys(got).length}/${total}), retrying`);
  }
  throw new Error("receiver didn't return the full config");
}
