// Lighting config (from LEOBOG ONE capture 06):
//   read  06 84 → 136-byte config; write = same config with byte 1 = 04
//   cfg[17] = 1 for Self-define, cfg[18] = effect id
//   cfg[64+2*id] = brightness 0–4, cfg[65+2*id] = speed<<4 | color index
import { EFFECTS, SELF_DEFINE } from "./keys.js";

const STORE = "hi75c-light";
const SD_DEFAULT = () => Object.fromEntries([1, 9, 14, 15, 21, 77, 82, 83, 89].map(i => [i, [255, 255, 255]]));
const clampInt = (v, lo, hi, d) => { v = Number(v); return Number.isInteger(v) ? Math.min(hi, Math.max(lo, v)) : d; };

export function cleanLight(l) {
  const out = { effect: 1, bright: 4, speed: 4, color: 7, keys: SD_DEFAULT() };
  if (!l || typeof l !== "object") return out;
  if (EFFECTS.some(e => e[0] === l.effect)) out.effect = l.effect;
  out.bright = clampInt(l.bright, 0, 4, 4); out.speed = clampInt(l.speed, 0, 4, 4); out.color = clampInt(l.color, 0, 7, 7);
  if (l.keys && typeof l.keys === "object") {
    out.keys = {};
    for (const [k, c] of Object.entries(l.keys)) {
      const i = Number(k);
      if (Number.isInteger(i) && i >= 0 && i < 126 && Array.isArray(c) && c.length === 3) out.keys[i] = c.map(x => clampInt(x, 0, 255, 0));
    }
  }
  return out;
}
export function loadLight() { try { return cleanLight(JSON.parse(localStorage.getItem(STORE))); } catch { return cleanLight(null); } }
export function saveLight(l) { try { localStorage.setItem(STORE, JSON.stringify(l)); } catch {} }

// Effect settings stored in a config read from the keyboard
export function effectFromConfig(cfg, id) { return { bright: cfg[64 + 2 * id] & 7, speed: cfg[65 + 2 * id] >> 4, color: cfg[65 + 2 * id] & 15 }; }

export function buildConfigWrite(cfg, l) {
  l = cleanLight(l);
  const out = new Uint8Array(520); out.set(cfg.slice(0, 136)); out[0] = 0x06; out[1] = 0x04;
  if (l.effect === SELF_DEFINE) { out[17] = 1; out[18] = SELF_DEFINE; }
  else { out[17] = 0; out[18] = l.effect; out[64 + 2 * l.effect] = l.bright; out[65 + 2 * l.effect] = ((l.speed & 15) << 4) | (l.color & 15); }
  return out;
}
