// Key codes, physical layout and factory tables of the LEOBOG Hi75C Pro.
//
// Keymap entry = 4 bytes big-endian [type][modifier bits][hi][lo]:
//   type 00 = keyboard usage (lo), modifiers as a bitmask in byte 1 (alone = modifier key, with a usage = combo)
//   type 02 = consumer usage (hi,lo)   type 0d = Fn / FN2
//   type 07 / 08 = built-in keyboard functions (BT, OS modes, lighting…)
// Matrix index = column*6 + row.

export const KB = u => u;                       // 00 00 00 uu
export const MOD = u => (1 << (u - 0xE0)) << 16;  // 00 mm 00 00
export const CON = u => (0x02 << 24) | u;         // 02 00 hh ll
export const FN = 0x0d000000;
export const FN2 = 0x0d010000;
export const KNOB = 0x0700001d;
export const SELF_DEFINE = 0x15;

export const CODES = [];
const add = (v, label, cat) => CODES.push({ v: v >>> 0, label, cat });
"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((c, i) => add(KB(4 + i), c, "Letters"));
"1234567890".split("").forEach((c, i) => add(KB(0x1E + i), c, "Numbers"));
[[0x28, "Enter"], [0x29, "Esc"], [0x2A, "Bksp"], [0x2B, "Tab"], [0x2C, "Space"], [0x2D, "-"], [0x2E, "="], [0x2F, "["], [0x30, "]"], [0x31, "\\"],
 [0x33, ";"], [0x34, "'"], [0x35, "`"], [0x36, ","], [0x37, "."], [0x38, "/"], [0x39, "Caps"], [0x64, "ISO \\"]]
  .forEach(([u, l]) => add(KB(u), l, "Symbols"));
for (let i = 1; i <= 12; i++) add(KB(0x39 + i), "F" + i, "F-keys");
for (let i = 13; i <= 24; i++) add(KB(0x68 + i - 13), "F" + i, "F-keys");
[[0x46, "PrtSc"], [0x47, "ScrLk"], [0x48, "Pause"], [0x49, "Ins"], [0x4A, "Home"], [0x4B, "PgUp"], [0x4C, "Del"], [0x4D, "End"], [0x4E, "PgDn"],
 [0x4F, "→"], [0x50, "←"], [0x51, "↓"], [0x52, "↑"], [0x65, "Menu"]]
  .forEach(([u, l]) => add(KB(u), l, "Navigation"));
[[0xE0, "L Ctrl"], [0xE1, "L Shift"], [0xE2, "L Alt"], [0xE3, "L Win"], [0xE4, "R Ctrl"], [0xE5, "R Shift"], [0xE6, "R Alt"], [0xE7, "R Win"]]
  .forEach(([u, l]) => add(MOD(u), l, "Modifiers"));
[[0x53, "NumLk"], [0x54, "KP /"], [0x55, "KP *"], [0x56, "KP -"], [0x57, "KP +"], [0x58, "KP Enter"], [0x59, "KP 1"], [0x5A, "KP 2"], [0x5B, "KP 3"],
 [0x5C, "KP 4"], [0x5D, "KP 5"], [0x5E, "KP 6"], [0x5F, "KP 7"], [0x60, "KP 8"], [0x61, "KP 9"], [0x62, "KP 0"], [0x63, "KP ."]]
  .forEach(([u, l]) => add(KB(u), l, "Numpad"));
[[0xCD, "Play/Pause"], [0xB5, "Next"], [0xB6, "Prev"], [0xB7, "Stop"], [0xE2, "Mute"], [0xE9, "Vol +"], [0xEA, "Vol −"], [0x6F, "Bright +"], [0x70, "Bright −"],
 [0x223, "Browser Home"], [0x192, "Calculator"], [0x18A, "Mail"], [0x221, "Search"], [0x29F, "Mission Control"], [0x2A0, "Launchpad"]]
  .forEach(([u, l]) => add(CON(u), l, "Media"));
add(FN, "Fn", "Special");
add(FN2, "FN2", "Special");
add(0, "Disabled", "Special");
[[0x08000000, "Light effect"], [0x08020000, "Light color"], [0x08030100, "Light +"], [0x08030200, "Light −"], [0x08040100, "Speed +"], [0x08040200, "Speed −"],
 [0x07000001, "Win Lock"], [0x0700001c, "Knob light"]]
  .forEach(([v, l]) => add(v, l, "Keyboard"));

export const BY_V = new Map(CODES.map(c => [c.v, c]));
export const CATS = ["All", ...new Set(CODES.map(c => c.cat)), "Combo"];
export const COMBO_KEYS = CODES.filter(c => ["Letters", "Numbers", "Symbols", "F-keys", "Navigation", "Numpad"].includes(c.cat));
export const COMBO_PRESETS = [
  ["Mac screenshot (area)", 0x000A0021], ["Mac screenshot (full)", 0x000A0020], ["Mac screenshot tool", 0x000A0022],
  ["Mac copy area to clipboard", 0x000B0021], ["Windows snip", 0x000A0016],
  ["Copy", 0x00010006], ["Paste", 0x00010019], ["Mac copy", 0x00080006], ["Mac paste", 0x00080019]];

// Built-in functions, named from the LEOBOG Hi75C Pro manual
export const SYS = {
  0x07000004: "Reset (hold)", 0x07000008: "2.4G", 0x07000005: "BT 1", 0x07000006: "BT 2", 0x07000007: "BT 3",
  0x07000019: "Android mode", 0x07000018: "Windows mode", 0x0700001a: "Mac mode", 0x0700001b: "iOS mode",
  0x07000001: "Win Lock", 0x0700001c: "Knob light", 0x0700001d: "Knob Mode", 0x0700000a: "No effect", 0x07000011: "No effect",
  0x08000000: "Light effect", 0x08020000: "Light color", 0x08030100: "Light +", 0x08030200: "Light −", 0x08040100: "Speed +", 0x08040200: "Speed −"};
export const isSpecial = v => { const t = v >>> 24; return t === 7 || t === 8; };

const MACMOD = { "L Win": "L Cmd", "R Win": "R Cmd", "L Alt": "L Opt", "R Alt": "R Opt" };
const MODSYM = ["⌃", "⇧", "⌥", "⌘"];
export const h2 = n => n.toString(16).padStart(2, "0");
export const hex8 = v => "0x" + (v >>> 0).toString(16).padStart(8, "0");
export function comboSymbols(m) { let s = ""; for (let i = 0; i < 4; i++) if (m & (1 << i) || m & (1 << (i + 4))) s += MODSYM[i]; return s; }
export const macName = (label, mac) => mac && MACMOD[label] ? MACMOD[label] : label;

export function labelOf(v, mac = false) {
  v = v >>> 0;
  const c = BY_V.get(v); if (c) return macName(c.label, mac);
  if (SYS[v]) return SYS[v];
  const t = v >>> 24, m = (v >> 16) & 255, u = v & 0xffff;
  if (t === 0 && m) { const k = BY_V.get(u); return comboSymbols(m) + (u ? (k ? k.label : "0x" + h2(u)) : ""); }
  if (t === 2) return "Media " + u.toString(16);
  if (t === 7) return "⚙ Sys " + h2(v & 255);
  if (t === 8) return "⚙ " + [(v >> 16) & 255, (v >> 8) & 255].map(h2).join("·");
  return hex8(v);
}

// Physical layout: rows of [matrixIndex, width, kind]; null index = gap
export const LAYOUT = [
  [[0], [null, 1], [12], [18], [24], [30], [null, .5], [36], [42], [48], [54], [null, .5], [60], [66], [72], [78], [null, .25], [84, 1, "knob"]],
  [[1], [7], [13], [19], [25], [31], [37], [43], [49], [55], [61], [67], [73], [79, 2], [null, .25], [85]],
  [[2, 1.5], [8], [14], [20], [26], [32], [38], [44], [50], [56], [62], [68], [74], [80, 1.5], [null, .25], [86]],
  [[3, 1.75], [9], [15], [21], [27], [33], [39], [45], [51], [57], [63], [69], [81, 2.25], [null, .25], [87]],
  [[4, 2.25], [10], [16], [22], [28], [34], [40], [46], [52], [58], [64], [70, 1.75], [null, .25], [82], [88]],
  [[5, 1.25], [11, 1.25], [17, 1.25], [35, 6.25], [53], [59], [65], [null, .25], [77], [83], [89]],
];
export const KEYS = 90;                                  // entries written per layer
export const ACCENT = new Set([0, 35, 79, 81, 77, 82, 83, 89]); // Esc, Space, Bksp, Enter, arrows — like the real colorway
export const FROW = [12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78];

// Factory tables read from the stock firmware (Windows: flash 0xCC00/0xD000, Mac: 0xCE00/0xD200)
const WIN_BASE = [41,53,43,57,131072,65536,0,30,20,4,29,524288,58,31,26,22,27,262144,59,32,8,7,6,0,60,33,21,9,25,0,61,34,23,10,5,44,62,35,28,11,17,0,63,36,24,13,16,0,64,37,12,14,54,4194304,65,38,18,15,55,218103808,66,39,19,51,56,1048576,67,45,47,52,2097152,0,68,46,48,0,0,80,69,42,49,40,82,81,117440541,76,77,75,78,79];
const WIN_FN = [117440516,117440520,134348800,0,0,0,0,117440517,117440537,0,0,117440513,33554544,117440518,117440536,0,0,0,33554543,117440519,117440538,0,0,0,262187,0,117440539,0,0,0,262185,0,0,117440522,117440529,0,134414848,0,0,0,0,0,134414592,0,70,0,0,0,33554614,0,71,0,0,0,33554637,0,72,0,0,0,33554613,0,0,0,0,0,33554658,0,0,0,0,0,33554666,0,0,0,0,134480384,33554665,117440540,134217728,0,134414592,134414848,0,73,74,0,0,134480128];
const MAC_BASE = [41,53,43,57,131072,65536,0,30,20,4,29,262144,33554544,31,26,22,27,524288,33554543,32,8,7,6,0,524331,33,21,9,25,0,524299,34,23,10,5,44,134414848,35,28,11,17,0,134414592,36,24,13,16,0,33554614,37,12,14,54,8388608,33554637,38,18,15,55,218103808,33554613,39,19,51,56,1048576,33554658,45,47,52,2097152,0,33554666,46,48,50,100,80,33554665,42,49,40,82,81,117440541,76,77,75,78,79];
const MAC_FN = [117440516,117440520,134348800,0,0,0,0,117440517,117440537,0,0,0,58,117440518,117440536,0,0,0,59,117440519,117440538,0,0,0,60,0,117440539,0,0,0,61,0,0,117440522,117440529,0,62,0,0,0,0,0,63,0,70,0,0,0,64,0,71,0,0,0,65,0,72,0,0,218103808,66,0,0,0,0,0,67,0,0,0,0,0,68,0,0,0,0,134480384,69,117440540,134217728,0,134414592,134414848,0,73,74,0,0,134480128];
export const FACTORY = { win: [WIN_BASE, WIN_FN], mac: [MAC_BASE, MAC_FN] };
// Physical legend of each matrix position (what is printed on the cap)
export const PHYS = WIN_BASE.map(v => v === KNOB ? "Knob" : (BY_V.get(v >>> 0)?.label ?? "?"));

// OS-mode table families. page = byte 4 of the keymap command header.
// Mac/iOS (page 1) can only be written with the one-time firmware patch (tools/hi75c_mac_patch.py).
export const MODES = [
  { id: "win", name: "Windows / Android", page: 0, layers: [0, 1, 2] },
  { id: "mac", name: "Mac / iOS", page: 1, layers: [0, 1] },   // FN2 is one table shared by all modes
];
export const LAYERS = ["Default", "FN1", "FN2", "Tap"];       // Tap is ignored by this model's firmware

// Codes that may ever be written (picker codes, built-in functions, factory values); combos are checked separately.
export const ALLOWED = new Set([...CODES.map(c => c.v), ...Object.keys(SYS).map(Number), ...WIN_BASE, ...WIN_FN, ...MAC_BASE, ...MAC_FN].map(v => v >>> 0));
const PLAIN_KEYS = new Set(COMBO_KEYS.map(c => c.v));
export const isCombo = n => (n >>> 24) === 0 && ((n >>> 16) & 255) !== 0 && ((n >>> 8) & 255) === 0 && PLAIN_KEYS.has(n & 255);
export const isAllowed = n => ALLOWED.has(n >>> 0) || isCombo(n >>> 0);

// Lighting effects (IDs from LEOBOG ONE captures; 6, 9 and 14 are unused)
export const EFFECTS = [[1, "Fixed on"], [2, "Respire"], [3, "Rainbow"], [4, "Flash away"], [5, "Raindrops"], [7, "Ripples shining"], [8, "Stars twinkle"],
  [10, "Retro snake"], [11, "Neon stream"], [12, "Reaction"], [13, "Sine wave"], [15, "Rotating windmill"], [16, "Colorful waterfall"], [17, "Blossoming"],
  [SELF_DEFINE, "Self-define"]];
export const PALETTE = [[255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0], [255, 0, 255], [0, 255, 255], [255, 255, 255], null]; // null = colorful
