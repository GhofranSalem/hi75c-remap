// Hi75C Pro remapper — UI. Protocol lives in device.js, data in keys.js, strings in i18n.js.
import { CODES, BY_V, CATS, COMBO_KEYS, COMBO_PRESETS, LAYOUT, ACCENT, PHYS, FACTORY, MODES, LAYERS, KEYS, FN2, KNOB, FROW, MOD, CON,
  EFFECTS, PALETTE, SELF_DEFINE, labelOf, macName, comboSymbols, isSpecial, isAllowed, ALLOWED, hex8 } from "./keys.js";
import { t, LANG, setLang, applyStatic } from "./i18n.js";
import * as hid from "./device.js";
import { createTyping } from "./typing.js";
import { loadLight, saveLight, buildConfigWrite, effectFromConfig } from "./lighting.js";

const $ = id => document.getElementById(id);
const el = (tag, props = {}, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };
const esc = s => String(s).replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));

// ======================= profiles (localStorage) =======================
// profile = { win: [layer0, layer1, layer2, layer3], mac: [...] }, layer = { matrixIndex: value } (only keys changed from factory)
const STORE = "hi75c-remap-v6";
const BAD_NAMES = new Set(["__proto__", "constructor", "prototype"]);
const blank = () => Object.fromEntries(MODES.map(m => [m.id, [{}, {}, {}, {}]]));
function cleanName(n) { n = String(n ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 40); return n && !BAD_NAMES.has(n) ? n : null; }
function cleanLayer(o) {
  const out = {};
  if (o && typeof o === "object" && !Array.isArray(o)) for (const [k, v] of Object.entries(o)) {
    const i = Number(k), n = Number(v);
    if (Number.isInteger(i) && i >= 0 && i < KEYS && Number.isInteger(n) && n >= 0 && n <= 0xFFFFFFFF && isAllowed(n)) out[i] = n >>> 0;
  }
  return out;
}
function cleanProfile(p) {
  const out = blank();
  for (const m of MODES) { const a = p && Array.isArray(p[m.id]) ? p[m.id] : []; out[m.id] = [cleanLayer(a[0]), cleanLayer(a[1]), cleanLayer(a[2]), {}]; }
  return out;
}
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE)); if (!raw || typeof raw.profiles !== "object") return null;
    const profiles = {};
    for (const [n, p] of Object.entries(raw.profiles)) { const c = cleanName(n); if (c) profiles[c] = cleanProfile(p); }
    const names = Object.keys(profiles); if (!names.length) return null;
    return { current: names.includes(raw.current) ? raw.current : names[0], profiles };
  } catch { return null; }
}
const state = load() || { current: "Default", profiles: { Default: blank() } };
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch {} };
const prof = () => state.profiles[state.current];

// ======================= view state =======================
let mode = "win", layer = 0, selected = null, cat = "All", comboMods = 0x08, painting = false, tab = "functions";
const M = () => MODES.find(x => x.id === mode);
const isMac = () => mode === "mac";
const cur = () => prof()[mode][layer];
const factory = (idx, l = layer, m = mode) => l < 2 ? FACTORY[m][l][idx] >>> 0 : 0;
function valueAt(idx, l = layer, m = mode) {
  const o = prof()[m][l][idx]; if (o !== undefined) return o >>> 0;
  if ((l === 1 || l === 2) && prof()[m][0][idx] === FN2) return FN2;   // an FN2 key in Default is mirrored into FN1/FN2, like LEOBOG ONE
  return factory(idx, l, m);
}
const label = v => labelOf(v, isMac());
const phys = idx => macName(PHYS[idx], isMac());

// OS mode the keyboard is in (read from its settings page), null = unknown
const OS_NAMES = ["Windows", "Android", "Mac", "iOS"];
let osMode = null;
async function detectOsMode(switchTab) {
  if (!hid.dev.cfg) return;
  try {
    const m = await hid.exclusively(hid.readOsMode);
    if (m !== osMode) log(`keyboard OS mode byte: ${m}${OS_NAMES[m] ? ` (${OS_NAMES[m]})` : ""}`);
    osMode = m in OS_NAMES ? m : null;
    if (switchTab && osMode !== null) { mode = osMode >= 2 ? "mac" : "win"; if (!M().layers.includes(layer)) layer = 0; refresh(); }
    renderStatus();
  } catch (e) { log("read OS mode error: " + e.message); }
}
addEventListener("focus", () => detectOsMode(false));       // user may have pressed Fn+W/E… on the keyboard

// What the keyboard holds, as far as we know (after a read or write). Drives the "unsaved changes" dot.
const onKeyboard = {};
const snapshot = m => JSON.stringify(prof()[m]);

// ======================= keyboard =======================
function renderKB() {
  const kb = $("kb"); kb.replaceChildren();
  const paint = paintMode();
  LAYOUT.forEach((row, r) => {
    const rowEl = el("div", { className: "kr" + (r === 0 ? " gap" : "") });
    for (const [idx, w = 1, kind] of row) {
      const width = `calc(var(--u)*${w} + ${w - 1}*var(--gap))`;
      if (idx === null) { const g = el("div", { className: "kgap" }); g.style.width = width; rowEl.append(g); continue; }
      const v = valueAt(idx), changed = v !== factory(idx), empty = layer > 0 && v === 0;
      const k = el("button", { type: "button", className: "k" });
      k.classList.toggle("acc", ACCENT.has(idx)); k.classList.toggle("knob", kind === "knob"); k.classList.toggle("changed", changed);
      k.classList.toggle("sel", selected === idx); k.classList.toggle("special", isSpecial(v)); k.classList.toggle("empty", empty);
      k.dataset.idx = idx; k.style.width = width; k.title = `${phys(idx)} — matrix ${idx}`;
      const txt = empty ? "·" : (kind === "knob" && v === KNOB ? "●" : label(v));
      k.innerHTML = (changed || layer > 0 ? `<span class="orig">${esc(phys(idx))}</span>` : "") + `<span class="lbl">${esc(txt)}</span>`;
      if (paint) { const c = light.keys[idx]; if (c && (c[0] || c[1] || c[2])) { k.style.background = `rgb(${c})`; k.classList.add("lit"); } }
      k.classList.toggle("tested", tab === "tester" && tested.has(idx));
      k.onclick = () => { if (paint) return paintKey(idx); select(idx); setTab("functions"); };
      rowEl.append(k);
    }
    kb.append(rowEl);
  });
}
function select(idx) {
  selected = idx;
  const v = valueAt(idx), now = layer > 0 && v === 0 ? t("none") : label(v);
  $("selInfo").innerHTML = `${t("selKey")}: <b>${esc(phys(idx))}</b> · ${t("selLayer")} ${LAYERS[layer]}<br>${t("selNow")}: <b>${esc(now)}</b>`;
  renderKB();
}
function assign(v) {
  if (selected === null) return toast(t("selectFirst"));
  v >>>= 0;
  if (v === factory(selected)) delete cur()[selected]; else cur()[selected] = v;
  changed(); select(selected);
}
function changed() { save(); renderChanges(); updateButtons(); }

// ======================= tabs =======================
function tabs(container, items, active, onPick) {
  container.replaceChildren(...items.map(([id, name]) => {
    const b = el("button", { type: "button", className: "tab" + (id === active ? " active" : ""), textContent: name });
    b.setAttribute("role", "tab"); b.setAttribute("aria-selected", id === active); b.onclick = () => onPick(id);
    return b;
  }));
}
function renderStage() {
  tabs($("modeTabs"), MODES.map(m => [m.id, m.name]), mode, id => { mode = id; if (!M().layers.includes(layer)) layer = 0; refresh(); });
  tabs($("layerTabs"), M().layers.map(i => [i, LAYERS[i]]), layer, i => { layer = i; refresh(); });
  const note = $("modeNote");
  if (isMac()) note.replaceChildren(t("modeMacNote") + " ", el("a", { href: "https://github.com/GhofranSalem/hi75c-remap#the-firmware-patch-one-time-optional", target: "_blank", rel: "noopener", textContent: t("howTo") }));
  else note.textContent = t("modeWinNote");
  $("layerHint").textContent = t(["hintDefault", "hintFn1", "hintFn2"][layer]);
  $("btnMacPreset").hidden = isMac();
}

// ======================= picker =======================
function renderCats() {
  $("cats").replaceChildren(...CATS.map(c => {
    const b = el("button", { type: "button", className: "cat" + (c === cat ? " active" : ""), textContent: c });
    b.onclick = () => { cat = c; renderCats(); renderGrid(); }; return b;
  }));
}
function renderGrid() {
  const q = $("search").value.trim().toLowerCase(), grid = $("grid");
  if (cat === "Combo" && !q) return grid.replaceChildren(comboBuilder());
  grid.replaceChildren(...CODES
    .filter(c => (cat === "All" || c.cat === cat) && (!q || c.label.toLowerCase().includes(q) || label(c.v).toLowerCase().includes(q)))
    .map(c => { const b = el("button", { type: "button", className: "opt", textContent: label(c.v) }); b.onclick = () => assign(c.v); return b; }));
}
function comboBuilder() {
  const mods = el("div", { className: "combo-mods" }, ...[["⌃ Ctrl", 0x01], ["⇧ Shift", 0x02], ["⌥ Alt / Opt", 0x04], ["⌘ Win / Cmd", 0x08]].map(([n, bit]) => {
    const b = el("button", { type: "button", className: "opt" + (comboMods & bit ? " on" : ""), textContent: n });
    b.setAttribute("aria-pressed", !!(comboMods & bit)); b.onclick = () => { comboMods ^= bit; renderGrid(); }; return b;
  }));
  const key = el("select", { id: "comboKey" }, ...COMBO_KEYS.map(c => el("option", { value: c.v, textContent: c.label })));
  key.setAttribute("aria-label", "Key"); key.value = String(0x21);
  const go = el("button", { type: "button", className: "write" });
  const upd = () => { go.textContent = `${t("comboAssign")}  ${comboSymbols(comboMods)}${BY_V.get(+key.value).label}`; };
  key.onchange = upd; upd();
  go.onclick = () => comboMods ? assign((comboMods << 16) | +key.value) : toast(t("comboNeedMod"));
  const presets = COMBO_PRESETS.map(([n, v]) => { const b = el("button", { type: "button", className: "opt", textContent: `${labelOf(v)}  ${n}` }); b.onclick = () => assign(v); return b; });
  return el("div", { className: "combo" }, mods, el("div", { className: "row" }, key, go), el("p", { className: "fine", textContent: t("comboPresets") }), el("div", { className: "combo-pre" }, ...presets));
}

// ======================= changes / profiles =======================
function renderChanges() {
  const lines = [];
  for (const m of MODES) prof()[m.id].forEach((lay, i) => Object.entries(lay).forEach(([idx, v]) =>
    lines.push(`[${m.name} · ${LAYERS[i]}] ${macName(PHYS[idx], m.id === "mac")}  →  ${labelOf(v, m.id === "mac")}   (${hex8(v)})`)));
  $("changes").textContent = lines.length ? lines.join("\n") : t("noChanges");
}
function renderProfiles() { $("profileSel").replaceChildren(...Object.keys(state.profiles).map(n => el("option", { value: n, textContent: n, selected: n === state.current }))); }
$("profileSel").onchange = e => { state.current = e.target.value; save(); refresh(); };
$("btnNewProfile").onclick = () => textBox(t("profileName"), "", "Gaming", txt => {
  const n = cleanName(txt.split("\n")[0]); if (!n) return toast(t("badProfile"));
  state.profiles[n] = blank(); state.current = n; save(); refresh();
});
$("btnExport").onclick = () => textBox("Export", t("copyThis"), JSON.stringify({ app: "hi75c-remap", v: 3, name: state.current, map: prof() }, null, 2), null, true);
$("btnImport").onclick = () => textBox("Import", t("pasteHere"), "", txt => {
  try {
    const d = JSON.parse(txt); if (!d?.map || !Array.isArray(d.map.win)) throw 0;
    const n = cleanName(d.name) || "Imported"; state.profiles[n] = cleanProfile(d.map); state.current = n; save(); refresh(); toast(t("imported"));
  } catch { toast(t("badProfile")); }
});

// ======================= keymap actions =======================
$("btnResetKey").onclick = () => { if (selected === null) return toast(t("selectFirst")); delete cur()[selected]; changed(); select(selected); };
$("btnResetLayer").onclick = () => { prof()[mode][layer] = {}; changed(); refresh(); };
$("btnResetAll").onclick = () => confirmBox(t("resetAllQ", { mode: M().name }), t("resetAllBody"), () => { prof()[mode] = [{}, {}, {}, {}]; changed(); refresh(); });
// Without the firmware patch: recreate Mac mode inside Windows mode (Win/Alt swapped, media on the F-row, F1–F12 on Fn).
$("btnMacPreset").onclick = () => {
  const [d, f] = prof().win, [base, fn] = FACTORY.win;
  d[11] = MOD(0xE2); d[17] = MOD(0xE3); d[53] = MOD(0xE7);
  for (const i of FROW) { d[i] = fn[i] >>> 0; f[i] = base[i] >>> 0; }
  d[24] = CON(0x29F); d[30] = CON(0x2A0);                   // F3 Mission Control, F4 Launchpad
  changed(); refresh(); toast(t("macPresetOk"));
};

$("btnRead").onclick = async () => {
  if (!hid.dev.cfg) return toast(t("connectFirst"));
  if (hid.dev.wireless) return toast(t("needCable"));
  try {
    const { layers, page } = M();
    const read = {}; await hid.exclusively(async () => { for (const c of layers) read[c] = await hid.readKeymap(c, page, KEYS); });
    const p = [{}, {}, {}, {}]; let unknown = 0;
    for (const l of layers) read[l].forEach((v, i) => {
      if (l > 0 && v === FN2 && read[0][i] === FN2) return;        // FN2 mirror, added automatically on write
      if (v === factory(i, l)) return;
      if (!isAllowed(v)) { ALLOWED.add(v); unknown++; }             // keep codes we don't know as they are
      p[l][i] = v;
    });
    const name = t("fromKeyboard"), np = cleanProfile(prof());     // keep the other mode's tables from the current profile
    np[mode] = p; state.profiles[name] = np; state.current = name; save();
    onKeyboard[mode] = snapshot(mode); refresh();
    log(`keymap read: ${p.reduce((a, o) => a + Object.keys(o).length, 0)} change(s) from factory${unknown ? `, ${unknown} unknown code(s) kept as-is` : ""}`);
    toast(t("readOk"));
  } catch (e) { log("read keymap error: " + e.message); toast(t("readFail")); }
};

$("btnWrite").onclick = () => {
  if (!hid.canWrite()) return toast(hid.dev.cfg ? t("wlOff") : t("connectFirst"));
  const m = M(), n = prof()[mode].reduce((a, l) => a + Object.keys(l).length, 0);
  confirmBox(t("writeTitle", { mode: m.name }), t("writeBody", { layers: t(isMac() ? "layersMac" : "layersWin"), n }), () => writeKeymap(m));
};
async function writeKeymap(m) {
  const b = $("btnWrite"); b.disabled = true; b.firstChild.textContent = t("writing");
  try {
    const chunks = isMac() ? m.layers : [0, 1, 2, 3];           // Mac: FN2/Tap are shared tables, written from the Windows tab
    const packets = new Map(chunks.map(c => [c, hid.keymapPacket(c, m.page, Array.from({ length: KEYS }, (_, i) => valueAt(i, c, m.id)))]));
    const r = await hid.exclusively(() => hid.writeKeymap(m.page, packets));
    if (r.ok) { onKeyboard[m.id] = snapshot(m.id); toast(t("writeOk")); log("write OK"); }
    else if (r.stock) { toast(t("writeFail")); confirmBox(t("patchTitle"), t(r.restored ? "patchBody" : "patchBodyBad"), null); }
  } catch (e) { log("write error: " + e.message); toast(t("writeFail")); }
  b.firstChild.textContent = t("write"); updateButtons();
}

// ======================= workspace tabs =======================
function setTab(name) {
  tab = name;
  document.querySelectorAll("#workTabs .tab").forEach(x => { const on = x.dataset.t === name; x.classList.toggle("active", on); x.setAttribute("aria-selected", on); });
  // All panes share one grid cell, so the panel keeps the height of the tallest one and the page never jumps.
  document.querySelectorAll(".work [data-p]").forEach(p => { const on = p.dataset.p === name; p.classList.toggle("active", on); p.inert = !on; });
  if (name === "typing") { if (!typing.loaded) typing.next(); typing.focus(); }
  renderKB(); renderTester();
}
document.querySelectorAll("#workTabs .tab").forEach(x => x.onclick = () => setTab(x.dataset.t));

// ======================= key tester / pressed keys =======================
// The browser reports a key by its HID usage (KeyboardEvent.code); light every key whose current Default sends it.
const EVCODE = { Escape: 0x29, Backquote: 0x35, Minus: 0x2d, Equal: 0x2e, Backspace: 0x2a, Tab: 0x2b, BracketLeft: 0x2f, BracketRight: 0x30, Backslash: 0x31,
  CapsLock: 0x39, Semicolon: 0x33, Quote: 0x34, Enter: 0x28, Comma: 0x36, Period: 0x37, Slash: 0x38, Space: 0x2c, Delete: 0x4c, PageUp: 0x4b, PageDown: 0x4e,
  Home: 0x4a, End: 0x4d, Insert: 0x49, ArrowUp: 0x52, ArrowDown: 0x51, ArrowLeft: 0x50, ArrowRight: 0x4f, IntlBackslash: 0x64, ContextMenu: 0x65,
  PrintScreen: 0x46, ScrollLock: 0x47, Pause: 0x48,
  ControlLeft: MOD(0xE0), ShiftLeft: MOD(0xE1), AltLeft: MOD(0xE2), MetaLeft: MOD(0xE3), ControlRight: MOD(0xE4), ShiftRight: MOD(0xE5), AltRight: MOD(0xE6), MetaRight: MOD(0xE7) };
function evToV(code) {
  if (EVCODE[code] !== undefined) return EVCODE[code] >>> 0;
  let m;
  if ((m = code.match(/^Key([A-Z])$/))) return 4 + m[1].charCodeAt(0) - 65;
  if ((m = code.match(/^Digit(\d)$/))) return m[1] === "0" ? 0x27 : 0x1d + +m[1];
  if ((m = code.match(/^F(\d+)$/))) { const n = +m[1]; return n <= 24 ? (n <= 12 ? 0x39 + n : 0x68 + n - 13) : null; }
  return null;
}
const keysSending = v => LAYOUT.flat().map(k => k[0]).filter(i => i !== null && valueAt(i, 0) === v);
const detectable = v => (v >>> 24) === 0 && (((v >>> 16) & 255) === 0 ? (v >= 4 && v <= 0x73) : (v & 0xffff) === 0);
const tested = new Set(), recent = [];
function renderTester() {
  if (tab !== "tester") return;
  const all = LAYOUT.flat().map(k => k[0]).filter(i => i !== null && detectable(valueAt(i, 0)));
  $("testCount").textContent = t("testerCount", { n: all.filter(i => tested.has(i)).length, total: all.length });
  $("keyLog").replaceChildren(...(recent.length ? recent.map(r => el("span", { className: "kl", textContent: r })) : [el("span", { className: "kl-empty", textContent: t("testerEmpty") })]));
}
$("btnTestReset").onclick = () => { tested.clear(); recent.length = 0; renderKB(); renderTester(); };
function onKey(ev, down) {
  if ($("modal").classList.contains("show")) { if (down && ev.key === "Escape") closeModal(); return; }
  const inField = ev.target !== $("tInput") && /INPUT|TEXTAREA|SELECT/.test(ev.target?.tagName);
  if (inField || (tab !== "tester" && tab !== "typing")) return;
  if (tab === "tester" && !((ev.metaKey || ev.ctrlKey) && !/^(Meta|Control)/.test(ev.code))) ev.preventDefault();   // keep Space/Tab/arrows from scrolling or moving focus
  const v = evToV(ev.code), idxs = v === null ? [] : keysSending(v);
  document.querySelectorAll(".k").forEach(k => { if (idxs.includes(+k.dataset.idx)) k.classList.toggle("pressed", down); });
  if (tab === "tester" && down && !ev.repeat) {
    idxs.forEach(i => tested.add(i));
    recent.unshift(ev.code + (ev.key && ev.key.length === 1 && ev.key !== " " ? ` ${ev.key}` : "")); recent.length = Math.min(recent.length, 24);
    idxs.forEach(i => document.querySelector(`.k[data-idx="${i}"]`)?.classList.add("tested"));
    renderTester();
  }
  if (tab === "typing" && down && ev.key === "Enter" && ev.target === $("tInput")) { ev.preventDefault(); if (typing.done) typing.next(); }
}
addEventListener("keydown", e => onKey(e, true));
addEventListener("keyup", e => onKey(e, false));
addEventListener("blur", () => document.querySelectorAll(".k.pressed").forEach(k => k.classList.remove("pressed")));

// ======================= typing (texts from Taqtaqa) =======================
const typing = createTyping({
  textEl: $("tText"), inputEl: $("tInput"), statsEl: $("tStats"),
  labels: { get wpm() { return t("wpm"); }, get acc() { return t("accuracy"); }, get done() { return t("typingDone"); } },
});
$("tNext").onclick = () => { typing.next(); typing.focus(); };
$("tText").onclick = () => typing.focus();

// ======================= lighting =======================
let light = loadLight(), lightCfg = null;
const paintMode = () => light.effect === SELF_DEFINE && painting && tab === "lighting";
const hexToRgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
function setLight(patch) { Object.assign(light, patch); saveLight(light); renderLight(); }
function paintKey(idx) { light.keys[idx] = hexToRgb($("sdColor").value); saveLight(light); renderKB(); }
function renderLight() {
  const sel = $("lEffect");
  if (!sel.options.length) sel.append(...EFFECTS.map(([id, n]) => el("option", { value: id, textContent: n })));
  sel.value = light.effect; $("lBright").value = light.bright; $("lSpeed").value = light.speed;
  const sd = light.effect === SELF_DEFINE; if (!sd) painting = false;
  document.querySelectorAll(".lrow").forEach(e => { e.hidden = sd; });
  $("sdBox").hidden = !sd;
  $("sdPaint").textContent = t(painting ? "paintStop" : "paint"); $("sdPaint").classList.toggle("on", painting);
  $("lColors").replaceChildren(...PALETTE.map((c, i) => {
    const d = el("button", { type: "button", className: "swatch" + (i === light.color ? " on" : ""), title: c ? `rgb(${c})` : t("colorful") });
    d.style.background = c ? `rgb(${c})` : "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)";
    d.setAttribute("role", "radio"); d.setAttribute("aria-checked", i === light.color); d.setAttribute("aria-label", d.title);
    d.onclick = () => setLight({ color: i }); return d;
  }));
  renderKB();
}
$("lEffect").onchange = e => { const effect = +e.target.value; setLight(lightCfg && effect !== SELF_DEFINE ? { effect, ...effectFromConfig(lightCfg, effect) } : { effect }); };
$("lBright").oninput = e => { light.bright = +e.target.value; saveLight(light); };
$("lSpeed").oninput = e => { light.speed = +e.target.value; saveLight(light); };
$("sdPaint").onclick = () => { painting = !painting; renderLight(); };
$("sdAll").onclick = () => { const c = hexToRgb($("sdColor").value); for (let i = 0; i < KEYS; i++) light.keys[i] = c; saveLight(light); renderKB(); };
$("sdClear").onclick = () => { light.keys = {}; saveLight(light); renderKB(); };
$("lRead").onclick = async () => {
  try {
    lightCfg = await hid.exclusively(hid.readConfig);
    const id = lightCfg[18];
    setLight(EFFECTS.some(e => e[0] === id) ? { effect: id, ...(id !== SELF_DEFINE ? effectFromConfig(lightCfg, id) : {}) } : {});
    log("config: " + [...lightCfg.slice(8, 72)].map(b => b.toString(16).padStart(2, "0")).join(" "));
    toast(t("readOk"));
  } catch (e) { log("read config error: " + e.message); toast(t("readFail")); }
};
$("lApply").onclick = async () => {
  if (!hid.canWrite()) return toast(t("wlOff"));
  const b = $("lApply"); b.disabled = true;
  try {
    await hid.exclusively(async () => {
      if (light.effect === SELF_DEFINE) { await hid.writeSelfDefine(light.keys); log("SET self-define colors"); }
      const out = buildConfigWrite(await hid.readConfig(), light);
      await hid.writeConfig(out);
      lightCfg = out.slice(0, 136); lightCfg[1] = 0x84;
    });
    log(`SET lighting: effect ${light.effect} bright ${light.bright} speed ${light.speed} color ${light.color}`);
    toast(t("lightOk"));
  } catch (e) { log("lighting error: " + e.message); toast(t("lightFail")); }
  updateButtons();
};

// ======================= connection =======================
$("btnConnect").onclick = async () => {
  if (!("hid" in navigator)) return toast(t("needChrome"));
  try {
    const r = await hid.connect();
    if (r.wrongModel) toast(t("wrongModel"));
    renderStatus(); updateButtons();
    await detectOsMode(true);
  } catch (e) { log("connect error: " + e.message); toast(t("connectFail")); }
};
hid.init({ onLog: s => log(s), onDisconnect: () => { for (const k in onKeyboard) delete onKeyboard[k]; osMode = null; renderStatus(); updateButtons(); } });
function renderStatus() {
  const on = !!hid.dev.product;
  $("dot").classList.toggle("on", on);
  $("status").textContent = on ? t(hid.dev.wireless ? "connected24" : "connectedUsb") + (osMode !== null ? " · " + t("osMode", { os: OS_NAMES[osMode] }) : "") : t("notConnected");
  $("status").title = on ? `${hid.dev.product.productName} (${hid.dev.product.vendorId.toString(16)}:${hid.dev.product.productId.toString(16)})` : "";
}
function updateButtons() {
  const conn = !!hid.dev.cfg, write = hid.canWrite(), wlTip = conn && !write ? t("wlOff") : "";
  for (const [id, ok] of [["btnWrite", write], ["lApply", write], ["lRead", conn], ["btnRead", conn && !hid.dev.wireless]]) {
    $(id).disabled = !ok; $(id).title = ok ? "" : (conn ? (wlTip || t("needCable")) : t("connectFirst"));
  }
  const pending = onKeyboard[mode] !== undefined && onKeyboard[mode] !== snapshot(mode);
  $("pending").hidden = !pending; $("btnWrite").classList.toggle("has-pending", pending);
  if (pending) $("btnWrite").title = t("pendingTitle");
}

// ======================= log / modal / toast =======================
function log(s) { const l = $("log"); l.textContent += `[${new Date().toLocaleTimeString("en-GB")}] ${s}\n`; l.scrollTop = l.scrollHeight; }
$("btnClearLog").onclick = () => { $("log").textContent = ""; };
$("btnCopyLog").onclick = () => copy($("log").textContent);
let modalCb = null;
// Text dialog (export/import/new profile). readonly → shows Copy instead of a callback.
function textBox(title, body, text, cb, readonly = false) { openModal(title, body, { text, readonly, cb }); }
// Yes/no dialog. cb null → info only (just OK).
function confirmBox(title, body, cb) { openModal(title, body, { cb, info: !cb }); }
function openModal(title, body, { text = null, readonly = false, cb = null, info = false }) {
  $("mTitle").textContent = title; $("mBody").textContent = body || "";
  const ta = $("mText"); ta.hidden = text === null; ta.value = text ?? ""; ta.readOnly = readonly;
  $("mCopy").hidden = !readonly; $("mCancel").hidden = info || readonly;
  modalCb = cb; $("modal").classList.add("show");
  (text !== null && !readonly ? ta : $("mOk")).focus();
}
function closeModal() { $("modal").classList.remove("show"); }
$("mOk").onclick = () => { const v = $("mText").value, cb = modalCb; closeModal(); cb?.(v); };
$("mCancel").onclick = closeModal;
$("modal").onclick = e => { if (e.target === $("modal")) closeModal(); };
$("mCopy").onclick = () => copy($("mText").value);
function copy(s) { navigator.clipboard.writeText(s).then(() => toast(t("copied")), () => toast(t("copyBlocked"))); }
function toast(m) { const e = $("toast"); e.textContent = m; e.classList.add("show"); clearTimeout(e._h); e._h = setTimeout(() => e.classList.remove("show"), 2400); }

// ======================= init =======================
function refresh() {
  renderStage(); renderProfiles(); renderKB(); renderChanges(); renderGrid(); updateButtons();
  if (selected !== null) select(selected); else $("selInfo").textContent = t("pickEmpty");
}
function relabel() {
  $("btnLang").textContent = LANG === "en" ? "عربي" : "English";
  renderStatus(); renderLight(); typing.setLang(LANG); refresh(); renderTester();
}
$("btnLang").onclick = () => { setLang(LANG === "en" ? "ar" : "en"); relabel(); };
$("search").oninput = renderGrid;
applyStatic(); renderCats(); relabel(); setTab("functions");

// Hooks for automated tests
window.__test = { state, assign, select, setMode: m => { mode = m; refresh(); } };
