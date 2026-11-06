// Music sync: audio from a tab/screen or the microphone → per-key colors at 25 fps.
// draw(cols) gets an Array(126) of [r,g,b] | null each frame.

const hsv = (h, s, v) => { const f = n => { const k = (n + h / 60) % 6; return Math.round(255 * v * (1 - s * Math.max(0, Math.min(k, 4 - k, 1)))); }; return [f(5), f(3), f(1)]; };
const COLS = 15, ROWS = 6, KEYS = 90;

let music = null;
export const isPlaying = () => !!music;

// Throws "no-audio" if the shared source has no audio track.
export async function start({ source, getStyle, getGain, draw, onEnded }) {
  let stream;
  if (source === "mic") stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  else { stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }); stream.getVideoTracks().forEach(t => t.stop()); }
  if (!stream.getAudioTracks().length) { stream.getTracks().forEach(t => t.stop()); throw new Error("no-audio"); }

  const ctx = new AudioContext(), an = ctx.createAnalyser();
  an.fftSize = 1024; an.smoothingTimeConstant = 0.55; ctx.createMediaStreamSource(stream).connect(an);
  const bins = new Uint8Array(an.frequencyBinCount), peaks = new Array(COLS).fill(0);
  let hue = 0, rings = [], drops = [], bassAvg = 0.2, cool = 0;
  const addRGB = (cols, i, c, w) => { const o = cols[i] || [0, 0, 0]; cols[i] = o.map((x, j) => Math.round(Math.min(255, x + c[j] * w))); };

  const frame = () => {
    an.getByteFrequencyData(bins);
    const gain = getGain(), cols = new Array(126).fill(null);
    // 15 log-spaced bands from ~60 Hz to ~12 kHz, one per keyboard column
    const ny = ctx.sampleRate / 2, lv = [];
    for (let c = 0; c < COLS; c++) {
      const f0 = 60 * Math.pow(200, c / COLS), f1 = 60 * Math.pow(200, (c + 1) / COLS);
      const a = Math.floor(f0 / ny * bins.length), b = Math.max(a + 1, Math.ceil(f1 / ny * bins.length));
      let m = 0; for (let i = a; i < b && i < bins.length; i++) m = Math.max(m, bins[i]);
      lv.push(Math.min(1, Math.pow(m / 255, 1.6) * gain));
    }
    hue = (hue + 0.6) % 360;
    const bass = (lv[0] + lv[1] + lv[2]) / 3, energy = lv.reduce((a, b) => a + b, 0) / COLS;
    bassAvg = bassAvg * 0.95 + bass * 0.05; cool--;
    const beat = bass > 0.2 && bass > bassAvg * 1.3 && cool <= 0; if (beat) cool = 6;

    switch (getStyle()) {
      case "wave":
        if (beat) rings.push({ r: 0, h: hue, a: 1 });
        rings.forEach(g => { g.r += 0.45; g.a *= 0.94; }); rings = rings.filter(g => g.r < 9 && g.a > 0.05);
        for (let i = 0; i < KEYS; i++) {
          const d = Math.hypot(Math.floor(i / ROWS) - 7, (i % ROWS - 2.5) * 0.8);
          rings.forEach(g => { const w = Math.exp(-Math.pow(d - g.r, 2) * 1.5) * g.a; if (w > 0.02) addRGB(cols, i, hsv(g.h, 1, 1), w); });
        }
        break;
      case "rain":
        for (let k = 0; k < Math.floor(energy * 3 + Math.random()); k++) drops.push({ c: Math.floor(Math.random() * COLS), y: 0, h: (hue + Math.random() * 60) % 360, v: 0.25 + Math.random() * 0.2 });
        drops.forEach(d => d.y += d.v); drops = drops.filter(d => d.y < 6.5);
        drops.forEach(d => { const r = Math.floor(d.y); if (r < ROWS) addRGB(cols, d.c * ROWS + r, hsv(d.h, 1, 1), 1); if (r - 1 >= 0 && r - 1 < ROWS) addRGB(cols, d.c * ROWS + r - 1, hsv(d.h, 1, 1), 0.3); });
        break;
      case "spectrum":
        for (let c = 0; c < COLS; c++) { const v = 0.05 + 0.95 * lv[c]; for (let r = 0; r < ROWS; r++) cols[c * ROWS + r] = hsv(c * 24, 1, v * (r === 0 ? 0.7 : 1)); }
        break;
      case "pulse": {
        const v = Math.min(1, bass * 1.2);
        for (let i = 0; i < KEYS; i++) cols[i] = hsv((hue + Math.floor(i / ROWS) * 12) % 360, 1, 0.08 + 0.92 * v);
        break;
      }
      default:                                                // equalizer bars with falling peaks
        for (let c = 0; c < COLS; c++) {
          peaks[c] = Math.max(lv[c], peaks[c] - 0.06); const h = Math.round(lv[c] * ROWS);
          for (let r = 0; r < ROWS; r++) {
            const fromBottom = ROWS - 1 - r;
            if (fromBottom < h) cols[c * ROWS + r] = hsv((120 - fromBottom * 24 + 360) % 360, 1, 1);
            else if (fromBottom === Math.min(ROWS - 1, Math.round(peaks[c] * ROWS))) cols[c * ROWS + r] = [255, 255, 255];
          }
        }
    }
    draw(cols);
  };
  music = { stream, ctx, timer: setInterval(frame, 40) };
  stream.getAudioTracks()[0].onended = () => { stop(); onEnded(); };
}

export function stop() {
  if (!music) return;
  clearInterval(music.timer); music.stream.getTracks().forEach(t => t.stop()); music.ctx.close(); music = null;
}
