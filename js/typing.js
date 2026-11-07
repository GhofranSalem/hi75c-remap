// Typing tab: type a real text (from Taqtaqa) to try the keyboard. Texts load on first use.
// Matching is lenient like Taqtaqa: أ/إ/آ = ا, ة = ه, ى = ي, ؤ = و, ئ = ي.

const NMAP = { "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ة": "ه", "ى": "ي", "ؤ": "و", "ئ": "ي" };
const same = (a, b) => a === b || (NMAP[a] || a) === (NMAP[b] || b);
const isArabic = s => /[؀-ۿ]/.test(s);
const STORE = "hi75c-typing-src";

export const SOURCES = ["masry", "saudi", "kalam", "hekam", "sheer", "hawadit", "en"];

export function createTyping({ textEl, inputEl, statsEl, sourceEl, labels, onDone }) {
  let texts = null, target = "", typed = "", start = 0, keys = 0, okKeys = 0, done = false, last = -1;
  let source = (() => { try { return localStorage.getItem(STORE); } catch { return null; } })();
  if (!SOURCES.includes(source)) source = "masry";

  async function load() { if (!texts) texts = (await import("./texts.js")).TEXTS; }
  async function next() {
    await load();
    const list = texts[source];
    let i; do { i = Math.floor(Math.random() * list.length); } while (list.length > 1 && i === last);
    last = i; target = list[i][0];
    sourceEl.textContent = list[i][1] || "";
    reset();
  }
  function reset() {
    typed = ""; start = 0; keys = 0; okKeys = 0; done = false;
    inputEl.value = ""; toEnd(); textEl.dir = isArabic(target) ? "rtl" : "ltr";
    render(); stats();
  }
  function render() {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < target.length; i++) {
      const s = document.createElement("span");
      s.textContent = target[i];
      if (i < typed.length) s.className = same(typed[i], target[i]) ? "ok" : (target[i] === " " ? "bad space" : "bad");
      if (i === typed.length && !done) s.classList.add("caret");
      frag.append(s);
    }
    textEl.replaceChildren(frag);
  }
  function stats() {
    const correct = [...typed].filter((c, i) => same(c, target[i])).length;
    const mins = start ? (Date.now() - start) / 60000 : 0;
    const wpm = mins > 0.02 ? Math.round(correct / 5 / mins) : 0;
    const acc = keys ? Math.round(okKeys / keys * 100) : 100;
    statsEl.textContent = `${wpm} ${labels.wpm} · ${acc}% ${labels.acc}` + (done ? ` · ${labels.done}` : "");
  }
  inputEl.addEventListener("input", () => {
    if (done) { inputEl.value = typed; return; }
    let v = inputEl.value.replace(/\n/g, " ");
    if (v.length > target.length) v = v.slice(0, target.length);
    if (!start && v.length) start = Date.now();
    for (let i = typed.length; i < v.length; i++) { keys++; if (same(v[i], target[i])) okKeys++; }   // new keystrokes only
    typed = v; if (inputEl.value !== v) inputEl.value = v;
    toEnd();
    if (typed.length === target.length) { done = true; onDone?.(); }
    render(); stats();
  });
  // The caret always stays at the end: typing is checked left to right, so no editing in the middle.
  const toEnd = () => { const n = inputEl.value.length; inputEl.setSelectionRange(n, n); };
  inputEl.addEventListener("keydown", e => { if (/^(Arrow|Home$|End$|Page)/.test(e.key)) e.preventDefault(); });
  inputEl.addEventListener("focus", () => setTimeout(toEnd));
  const tick = setInterval(() => { if (start && !done) stats(); }, 500);

  return {
    next, reset,
    focus: () => inputEl.focus({ preventScroll: true }),
    get source() { return source; },
    setSource(s) { if (!SOURCES.includes(s)) return; source = s; try { localStorage.setItem(STORE, s); } catch {} next(); },
    get loaded() { return !!target; },
    stop: () => clearInterval(tick),
  };
}
