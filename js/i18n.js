// UI strings. Static HTML uses data-i="key" (text), data-i-title, data-i-ph (placeholder).
// t(key, {var}) fills {var} placeholders.
const S = {
  appSub:        { en: "Key Remapper", ar: "تخصيص الزراير" },
  notConnected:  { en: "Not connected", ar: "مش متوصل" },
  connectedUsb:  { en: "Connected by cable", ar: "متوصل بالكابل" },
  connected24:   { en: "Connected over 2.4G", ar: "متوصل بالوايرلس 2.4G" },
  osMode:        { en: "{os} mode", ar: "مود {os}" },
  connect:       { en: "Connect keyboard", ar: "توصيل الكيبورد" },
  write:         { en: "Write to keyboard", ar: "اكتب على الكيبورد" },
  writing:       { en: "Writing…", ar: "بيكتب…" },
  pendingTitle:  { en: "You have changes that aren't on the keyboard yet", ar: "فيه تعديلات لسه ماتكتبتش على الكيبورد" },

  modeWinNote:   { en: "Used in Windows (Fn+W) and Android modes.", ar: "بتشتغل في مود Windows (Fn+W) و Android." },
  modeMacNote:   { en: "Used in Mac (Fn+E) and iOS modes. Writing these needs the one-time firmware patch and the USB cable —", ar: "بتشتغل في مود Mac (Fn+E) و iOS. الكتابة عليها محتاجة باتش الفيرموير مرة واحدة والكابل —" },
  howTo:         { en: "how", ar: "إزاي" },
  hintDefault:   { en: "What keys do when pressed normally. Click a key, then pick its new function.", ar: "اللي الزراير بتعمله لما تدوسها عادي. دوس على زرار وبعدين اختار وظيفته الجديدة." },
  hintFn1:       { en: "What keys do while holding Fn. Keys marked “·” do nothing on this layer.", ar: "اللي الزراير بتعمله وانت ماسك Fn. الزرار اللي عليه «·» مش بيعمل حاجة في الطبقة دي." },
  hintFn2:       { en: "What keys do while holding an FN2 key. To use it, set a key in Default to FN2 (under Special).", ar: "اللي الزراير بتعمله وانت ماسك زرار FN2. عشان تستخدمها خلي زرار في Default يبقى FN2 (من Special)." },

  readKeymap:    { en: "Read from keyboard", ar: "اقرا من الكيبورد" },
  macPreset:     { en: "Mac layout", ar: "ترتيب الماك" },
  macPresetTip:  { en: "Without the firmware patch: recreates Mac mode inside Windows mode (Win/Alt swapped, media on the F-row)", ar: "من غير باتش الفيرموير: بيعمل ترتيب الماك جوه مود Windows (Win وAlt متبدلين، والميديا على صف الـ F)" },
  testMode:      { en: "Test mode", ar: "وضع الاختبار" },
  testStop:      { en: "Stop test", ar: "إيقاف الاختبار" },
  testHint:      { en: "Test mode is on: press keys on the keyboard and they light up here.", ar: "وضع الاختبار شغال: دوس على زراير الكيبورد وهتنوّر هنا." },
  resetKey:      { en: "Reset key", ar: "رجّع الزرار" },
  resetLayer:    { en: "Reset layer", ar: "رجّع الطبقة" },
  resetAll:      { en: "Reset all", ar: "رجّع الكل" },
  resetAllQ:     { en: "Reset every layer of {mode} to factory?", ar: "ترجّع كل طبقات {mode} لإعدادات المصنع؟" },
  resetAllBody:  { en: "This only changes the profile in this browser. The keyboard changes when you click “Write to keyboard”.", ar: "ده بيغيّر البروفايل اللي في المتصفح بس. الكيبورد بيتغير لما تدوس «اكتب على الكيبورد»." },
  rescue:        { en: "If anything goes wrong: hold Fn+Esc for 3 seconds to restore factory settings.", ar: "لو أي حاجة باظت: دوس Fn+Esc مع بعض 3 ثواني عشان الكيبورد يرجع لإعدادات المصنع." },

  pickTitle:     { en: "New function", ar: "الوظيفة الجديدة" },
  pickEmpty:     { en: "Click any key on the keyboard to change it.", ar: "دوس على أي زرار في الكيبورد عشان تغيّره." },
  selKey:        { en: "Key", ar: "الزرار" },
  selLayer:      { en: "layer", ar: "طبقة" },
  selNow:        { en: "Now", ar: "دلوقتي" },
  none:          { en: "(none)", ar: "(مفيش)" },
  searchPh:      { en: "Search: Home, Mute, F13, Cmd…", ar: "دوّر: Home, Mute, F13, Cmd…" },
  comboAssign:   { en: "Assign", ar: "حط الاختصار" },
  comboNeedMod:  { en: "Pick Ctrl, Shift, Alt or Win first", ar: "اختار Ctrl أو Shift أو Alt أو Win الأول" },
  comboPresets:  { en: "Ready-made shortcuts:", ar: "اختصارات جاهزة:" },
  selectFirst:   { en: "Select a key on the keyboard first", ar: "اختار زرار من الكيبورد الأول" },

  lighting:      { en: "Lighting", ar: "الإضاءة" },
  effect:        { en: "Effect", ar: "التأثير" },
  brightness:    { en: "Brightness", ar: "السطوع" },
  speed:         { en: "Speed", ar: "السرعة" },
  color:         { en: "Color", ar: "اللون" },
  colorful:      { en: "Colorful", ar: "ألوان" },
  sdHint:        { en: "Pick a color, click “Paint”, then click keys on the keyboard above.", ar: "اختار لون، ودوس «لوّن»، وبعدين دوس على الزراير في الكيبورد اللي فوق." },
  paint:         { en: "Paint", ar: "لوّن" },
  paintStop:     { en: "Stop painting", ar: "وقّف التلوين" },
  fillAll:       { en: "Fill all", ar: "لوّن الكل" },
  clearAll:      { en: "Clear all", ar: "امسح الكل" },
  readLight:     { en: "Read from keyboard", ar: "اقرا من الكيبورد" },
  applyLight:    { en: "Apply lighting", ar: "طبّق الإضاءة" },
  music:         { en: "Music sync", ar: "مع الموسيقى" },
  audio:         { en: "Audio", ar: "الصوت" },
  srcTab:        { en: "Tab or screen audio", ar: "صوت تاب أو الشاشة" },
  srcMic:        { en: "Microphone", ar: "المايك" },
  style:         { en: "Style", ar: "الشكل" },
  stBars:        { en: "Equalizer (bars)", ar: "Equalizer (أعمدة)" },
  stPulse:       { en: "Pulse (whole keyboard)", ar: "نبض (الكيبورد كله)" },
  stWave:        { en: "Wave from center", ar: "موجة من النص" },
  stRain:        { en: "Rain", ar: "مطر" },
  stSpectrum:    { en: "Spectrum colors", ar: "ألوان السبكتروم" },
  sensitivity:   { en: "Sensitivity", ar: "الحساسية" },
  start:         { en: "Start", ar: "ابدأ" },
  stop:          { en: "Stop", ar: "وقّف" },
  musicHint:     { en: "Runs while this page is open (USB cable). When you stop, the keyboard returns to its own effect after a second.", ar: "شغالة طول ما الصفحة مفتوحة (بالكابل). لما توقفها، الكيبورد بيرجع لإضاءته العادية بعد ثانية." },

  profiles:      { en: "Profiles", ar: "البروفايلات" },
  newProfile:    { en: "New", ar: "جديد" },
  profileName:   { en: "New profile name", ar: "اسم البروفايل الجديد" },
  profilesHint:  { en: "Changes are saved in this browser. The keyboard only changes when you click “Write to keyboard”.", ar: "التعديلات بتتحفظ في المتصفح ده. الكيبورد مش بيتغيّر غير لما تدوس «اكتب على الكيبورد»." },
  fromKeyboard:  { en: "From keyboard", ar: "من الكيبورد" },
  copyThis:      { en: "Copy this text and keep it.", ar: "انسخ النص ده واحفظه." },
  pasteHere:     { en: "Paste the profile here.", ar: "الصق البروفايل هنا." },
  imported:      { en: "Imported", ar: "اتعمل Import" },
  badProfile:    { en: "That is not a valid profile", ar: "ده مش بروفايل صالح" },
  changes:       { en: "Changes", ar: "التغييرات" },
  noChanges:     { en: "No changes yet — every key is at its factory setting.", ar: "مفيش تغييرات لسه — كل الزراير على إعدادات المصنع." },
  clear:         { en: "Clear", ar: "مسح" },
  copy:          { en: "Copy", ar: "نسخ" },
  copied:        { en: "Copied", ar: "اتنسخ" },
  copyBlocked:   { en: "Copy was blocked — copy it manually", ar: "النسخ اترفض — انسخ يدوي" },
  ok:            { en: "OK", ar: "تمام" },
  cancel:        { en: "Cancel", ar: "إلغاء" },
  footer:        { en: "Unofficial tool, not affiliated with LEOBOG or AULA. Talks to the keyboard over WebHID in Chrome/Edge; nothing leaves your computer.", ar: "أداة غير رسمية، مالهاش علاقة بـ LEOBOG أو AULA. بتكلم الكيبورد عن طريق WebHID في Chrome أو Edge، ومفيش أي حاجة بتطلع من جهازك." },

  needChrome:    { en: "Open this page in Chrome or Edge", ar: "افتح الصفحة في Chrome أو Edge" },
  connectFail:   { en: "Connection failed — check the Log", ar: "التوصيل فشل — بص في الـ Log" },
  connectFirst:  { en: "Connect the keyboard first", ar: "وصّل الكيبورد الأول" },
  wrongModel:    { en: "This is not a Hi75C Pro — writing is disabled for safety", ar: "ده مش Hi75C Pro — الكتابة اتقفلت عشان الأمان" },
  wlOff:         { en: "Writing over 2.4G is turned off for now — connect the USB cable", ar: "الكتابة بالوايرلس 2.4G مقفولة مؤقتاً — وصّل الكابل" },
  needCable:     { en: "This needs the USB cable", ar: "دي محتاجة الكابل" },
  readOk:        { en: "Read from keyboard ✓", ar: "اتقرا من الكيبورد ✓" },
  readFail:      { en: "Read failed — check the Log", ar: "القراية فشلت — بص في الـ Log" },
  writeTitle:    { en: "Write {mode} keymap", ar: "كتابة كي ماب {mode}" },
  writeBody:     { en: "{layers} will be written with {n} change(s) from factory, replacing what is stored on the keyboard. Keep the LEOBOG app closed.", ar: "هيتكتب {layers} وفيهم {n} تغيير عن المصنع، مكان اللي متخزن على الكيبورد. خلي برنامج LEOBOG مقفول." },
  writeOk:       { en: "Written to keyboard ✓ — try the keys", ar: "اتكتب على الكيبورد ✓ — جرّب الزراير" },
  writeFail:     { en: "Write failed — check the Log", ar: "الكتابة فشلت — بص في الـ Log" },
  patchTitle:    { en: "Firmware patch needed", ar: "محتاج باتش الفيرموير" },
  patchBody:     { en: "This keyboard still runs the stock firmware, which can only write the Windows tables. Nothing was changed. Writing the Mac tables needs the one-time firmware patch (see the README).", ar: "الكيبورد لسه على الفيرموير الأصلي، واللي بيكتب على جداول الويندوز بس. مفيش حاجة اتغيرت. الكتابة على جداول الماك محتاجة باتش الفيرموير مرة واحدة (بص في الـ README)." },
  patchBodyBad:  { en: "This keyboard still runs the stock firmware. Restoring the Windows Default layer did not verify — hold Fn+Esc for 3 seconds to reset the keyboard.", ar: "الكيبورد لسه على الفيرموير الأصلي، ورجوع طبقة Default في الويندوز ماتأكدش — دوس Fn+Esc 3 ثواني عشان ترجّع الكيبورد للمصنع." },
  lightOk:       { en: "Lighting applied ✓", ar: "الإضاءة اتطبقت ✓" },
  lightFail:     { en: "Lighting failed — check the Log", ar: "الإضاءة فشلت — بص في الـ Log" },
  noAudio:       { en: "No audio — tick “Share audio” in the dialog", ar: "مفيش صوت — علّم على Share audio في الشباك" },
  audioFail:     { en: "Couldn't access audio — check the Log", ar: "مقدرتش أوصل للصوت — بص في الـ Log" },
  macPresetOk:   { en: "Mac layout applied — write it, and keep the keyboard in Windows mode (Fn+W)", ar: "اتطبق ترتيب الماك — اكتبه على الكيبورد وخليه على مود Windows (Fn+W)" },
  layersWin:     { en: "The Default, FN1 and FN2 layers", ar: "طبقة Default وFN1 وFN2" },
  layersMac:     { en: "The Mac / iOS Default and FN1 layers", ar: "طبقة Default وFN1 بتوع Mac / iOS" },
};

const STORE = "hi75c-lang";
export let LANG = (() => { try { return localStorage.getItem(STORE) || "en"; } catch { return "en"; } })();

export function t(key, vars) {
  const e = S[key]; let s = e ? e[LANG] ?? e.en : key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
  return s;
}
export function setLang(l) { LANG = l; try { localStorage.setItem(STORE, l); } catch {} applyStatic(); }
export function applyStatic(root = document) {
  document.documentElement.lang = LANG; document.documentElement.dir = LANG === "ar" ? "rtl" : "ltr";
  root.querySelectorAll("[data-i]").forEach(e => { e.textContent = t(e.dataset.i); });
  root.querySelectorAll("[data-i-ph]").forEach(e => { e.placeholder = t(e.dataset.iPh); });
  root.querySelectorAll("[data-i-title]").forEach(e => { e.title = t(e.dataset.iTitle); });
}
