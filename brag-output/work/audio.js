// One soundtrack per reel: a D major pad at 84 BPM, with every on-screen event
// (hook line, tap, push, ring, drop, lockup) played as a note or breath from
// the same chord, through the same room, so the effects sit inside the music.
const fs = require('fs');
const C = JSON.parse(fs.readFileSync('brag.json'));
// The three captures, merged onto the one clock they were recorded against.
const E = { taps: [], pushes: [], rings: {} };
C.segs.forEach(s => { const e = JSON.parse(fs.readFileSync(`events-${s.id}.json`)); E.taps.push(...e.taps); E.pushes.push(...e.pushes); Object.assign(E.rings, e.rings); });
C.phone = [C.segs[0].in]; C.drop = C.segs[C.segs.length - 1].out;
C.captions = C.segs.map(s => s.cap);
const SR = 48000, DUR = C.duration, N = Math.round(SR * DUR);
const music = [new Float32Array(N), new Float32Array(N)];
const fx = [new Float32Array(N), new Float32Array(N)]; // goes through the room
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

// Chords (MIDI): D, Bm7, Gmaj7, then D add9 for the payoff.
const D0 = C.drop;
const chords = [
  { t: 0, notes: [50, 57, 62, 66, 69] },
  { t: C.segs[1].in, notes: [47, 54, 62, 66, 69] },
  { t: C.segs[2].in, notes: [43, 55, 59, 62, 66] },
  { t: D0, notes: [50, 57, 64, 66, 69, 74] },
];
const chordAt = t => chords.filter(c => c.t <= t).pop();

function add(buf, i, l, r) { if (i >= 0 && i < N) { buf[0][i] += l; buf[1][i] += r; } }

// Pad: detuned sine stacks per chord, slow crossfades, gentle swell at the payoff.
chords.forEach((c, ci) => {
  const t0 = c.t, t1 = ci < chords.length - 1 ? chords[ci + 1].t : DUR;
  const a = 1.2, rel = 1.4;
  const i0 = Math.max(0, Math.round((t0 - (ci ? 0.6 : 0)) * SR)), i1 = Math.min(N, Math.round((t1 + rel) * SR));
  c.notes.forEach((m, ni) => {
    const f = hz(m), pan = (ni / (c.notes.length - 1)) * 0.6 - 0.3, vol = (m < 52 ? 0.05 : 0.026);
    for (let i = i0; i < i1; i++) {
      const t = i / SR, lt = t - (t0 - (ci ? 0.6 : 0));
      let env = Math.min(1, lt / a);
      if (t > t1) env *= Math.max(0, 1 - (t - t1) / rel);
      const sw = ci === 3 ? 1 + 0.5 * Math.min(1, (t - t0) / 1.5) : 1;
      const end = Math.min(1, (DUR - t) / 1.6);
      const lfo = 1 + 0.15 * Math.sin(2 * Math.PI * 0.21 * t + ni);
      const s = (Math.sin(2 * Math.PI * f * t) + 0.6 * Math.sin(2 * Math.PI * f * 1.003 * t + ni) + 0.25 * Math.sin(2 * Math.PI * f * 2.001 * t)) * vol * env * sw * end * lfo;
      add(music, i, s * (1 - pan), s * (1 + pan));
    }
  });
});

// A soft pulse: one felt note per beat once the phone is up, chord tones climbing.
const BEAT = 60 / 84;
function bell(buf, t, m, v, decay = 1.6, pan = 0) {
  const f = hz(m), i0 = Math.round(t * SR), len = Math.round(decay * 2.5 * SR);
  for (let j = 0; j < len; j++) {
    const tt = j / SR, env = Math.min(1, tt / 0.004) * Math.exp(-tt / (decay * 0.45));
    const s = (Math.sin(2 * Math.PI * f * tt) + 0.3 * Math.sin(2 * Math.PI * f * 2 * tt) * Math.exp(-tt * 3) + 0.08 * Math.sin(2 * Math.PI * f * 3.01 * tt) * Math.exp(-tt * 6)) * v * env;
    add(buf, i0 + j, s * (1 - pan), s * (1 + pan));
  }
}
for (let t = C.phone[0] + 0.7; t < D0 - 0.2; t += BEAT) {
  const n = chordAt(t).notes.filter(m => m >= 62), k = Math.round((t - C.phone[0]) / BEAT);
  bell(music, t, n[k % n.length] + 12 * (k % 4 === 3 ? 1 : 0), 0.018, 1.0, ((k % 3) - 1) * 0.35);
}

// Breaths: band-limited noise with a moving centre, for rises, pushes and the drop.
function breath(t, dur, v, f0, f1, pan = 0) {
  const i0 = Math.round(t * SR), len = Math.round(dur * SR);
  // Three poles down at fc, minus three at fc/3: a soft band with no hiss on top.
  const lo = [0, 0, 0], hi = [0, 0, 0];
  for (let j = 0; j < len; j++) {
    const k = j / len, env = Math.sin(Math.PI * Math.pow(k, 0.6)) ** 2;
    const fc = f0 + (f1 - f0) * k, a = 1 - Math.exp(-2 * Math.PI * fc / SR), b = 1 - Math.exp(-2 * Math.PI * fc / 3 / SR);
    let x = rnd(), y = x;
    for (let q = 0; q < 3; q++) { lo[q] += a * (x - lo[q]); x = lo[q]; hi[q] += b * (y - hi[q]); y = hi[q]; }
    const s = (x - y) * v * env * 4;
    add(fx, i0 + j, s * (1 - pan), s * (1 + pan));
  }
}

// Hook: one note per line as it lands.
C.hook.forEach((_, i) => bell(fx, 0.15 + i * 0.3 + (i === C.hookAccent ? 0.2 : 0) + 0.05, [69, 74, 78, 81][i], i === C.hookAccent ? 0.08 : 0.05, 1.8, (i - 1.5) * 0.2));
// Each card slides out to the left: a breath that moves across the stereo field.
C.segs.slice(0, -1).forEach(s => { breath(s.out - 0.05, 0.75, 0.16, 600, 2000, 0.25); breath(s.out + 0.1, 0.6, 0.1, 1600, 700, -0.25); });
// The phone rises, and later drops away.
breath(C.phone[0] - 0.1, 0.9, 0.22, 400, 2400);
breath(D0, 0.8, 0.18, 2200, 350);
// Taps: a soft pluck from the chord; typed keys: barely a tick.
E.taps.forEach(tp => {
  if (tp.key) { breath(tp.t, 0.04, 0.03, 2400, 2000, 0.2); return; }
  const n = chordAt(tp.t).notes.filter(m => m >= 62);
  bell(fx, tp.t, n[n.length - 1] + 12, 0.05, 0.7, 0.1);
});
E.pushes.forEach(pu => breath(pu.t + 0.02, 0.4, 0.14, 1800, 700, 0.15));
// Focus rings: two notes, a fifth apart.
Object.values(E.rings).forEach(fr => {
  const t = Math.min(...Object.keys(fr).map(Number)) / 30;
  const r = chordAt(t).notes[0] + 24;
  bell(fx, t, r + 7, 0.05, 1.6, -0.2); bell(fx, t + 0.16, r + 12, 0.045, 1.8, 0.2);
});
// Captions: a very quiet low note so each one lands without a click.
C.captions.forEach(c => bell(fx, c[0], chordAt(c[0]).notes[1] + 12, 0.025, 1.4));
// Payoff: the lockup arrives on the full chord.
[62, 66, 69, 74, 76].forEach((m, i) => bell(fx, D0 + 0.9 + i * 0.07, m + 12, 0.045, 2.6, (i - 2) * 0.2));

// The room: a small Schroeder reverb shared by the effects (and a little of the pad).
function reverb(inp) {
  const out = [new Float32Array(N), new Float32Array(N)];
  [0, 1].forEach(ch => {
    const combs = [1557, 1617, 1491, 1422].map(d => ({ d: d + ch * 23, buf: new Float32Array(d + ch * 23), i: 0, lp: 0 }));
    const aps = [556, 441, 341].map(d => ({ d, buf: new Float32Array(d), i: 0 }));
    for (let n = 0; n < N; n++) {
      const x = inp[ch][n] * 0.25; let y = 0;
      combs.forEach(c => { const o = c.buf[c.i]; c.lp = o * 0.6 + c.lp * 0.4; c.buf[c.i] = x + c.lp * 0.84; c.i = (c.i + 1) % c.d; y += o; });
      aps.forEach(a => { const o = a.buf[a.i]; const v = y + o * 0.5; a.buf[a.i] = v; y = o - v * 0.5; a.i = (a.i + 1) % a.d; });
      out[ch][n] = y;
    }
  });
  return out;
}
const send = [0, 1].map(ch => fx[ch].map((v, i) => v + music[ch][i] * 0.3));
const wet = reverb(send);
const L = new Int16Array(N * 2);
let peak = 0; const mix = [];
for (let i = 0; i < N; i++) {
  const fade = Math.min(1, i / (SR * 0.05));
  const l = (music[0][i] + fx[0][i] * 0.8 + wet[0][i] * 0.55) * fade, r = (music[1][i] + fx[1][i] * 0.8 + wet[1][i] * 0.55) * fade;
  mix.push(l, r); peak = Math.max(peak, Math.abs(l), Math.abs(r));
}
const g = 0.85 / peak;
mix.forEach((v, i) => L[i] = Math.max(-32767, Math.min(32767, Math.tanh(v * g) * 32767)));
const hdr = Buffer.alloc(44);
hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + L.length * 2, 4); hdr.write('WAVE', 8); hdr.write('fmt ', 12);
hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22); hdr.writeUInt32LE(SR, 24);
hdr.writeUInt32LE(SR * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(L.length * 2, 40);
fs.writeFileSync('audio.wav', Buffer.concat([hdr, Buffer.from(L.buffer)]));
console.log('audio', DUR + 's', 'peak', peak.toFixed(3));
