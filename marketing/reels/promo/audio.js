// One soundtrack for the whole promo, the reels' music (../build/audio.js)
// run long: the same D major pad at 84 BPM and the same room, so it sounds
// like the same Sprout, but one bed from first frame to last. The chords keep
// turning, D, Bm7, Gmaj7, every five seconds, and the payoff chord is held
// back for the end card. Every event in every scene (a phone rising, a tap,
// a push, a card lifting, a caption landing) is played from the chord under
// it, through the room, so the effects sit inside the music. Writes music.wav.
const fs = require('fs');
const P = JSON.parse(fs.readFileSync('promo.json'));
const SR = 48000, DUR = P.duration, N = Math.round(SR * DUR);
const music = [new Float32Array(N), new Float32Array(N)];
const fx = [new Float32Array(N), new Float32Array(N)]; // goes through the room
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

// Chords (MIDI): D, Bm7, Gmaj7 round and round, then D add9 for the payoff.
const D0 = P.end.lock, CYCLE = [[50, 57, 62, 66, 69], [47, 54, 62, 66, 69], [43, 55, 59, 62, 66]];
const chords = [];
for (let t = 0, i = 0; t < D0 - 1; t += 5, i++) chords.push({ t, notes: CYCLE[i % 3] });
chords.push({ t: D0, notes: [50, 57, 64, 66, 69, 74], pay: true });
const chordAt = t => chords.filter(c => c.t <= t).pop();

function add(buf, i, l, r) { if (i >= 0 && i < N) { buf[0][i] += l; buf[1][i] += r; } }

// Pad: detuned sine stacks per chord, slow crossfades, gentle swell at the payoff.
chords.forEach((c, ci) => {
  const t0 = c.t, t1 = ci < chords.length - 1 ? chords[ci + 1].t : DUR;
  const a = 1.2, rel = 1.4, s0 = t0 - (ci ? 0.6 : 0);
  const i0 = Math.max(0, Math.round(s0 * SR)), i1 = Math.min(N, Math.round((t1 + rel) * SR));
  c.notes.forEach((m, ni) => {
    const f = hz(m), pan = (ni / (c.notes.length - 1)) * 0.6 - 0.3, vol = (m < 52 ? 0.05 : 0.026);
    for (let i = i0; i < i1; i++) {
      const t = i / SR;
      let env = Math.min(1, (t - s0) / a);
      if (t > t1) env *= Math.max(0, 1 - (t - t1) / rel);
      const sw = c.pay ? 1 + 0.5 * Math.min(1, (t - t0) / 1.5) : 1;
      const end = Math.min(1, (DUR - t) / 1.6), start = Math.min(1, t / 0.05);
      const lfo = 1 + 0.15 * Math.sin(2 * Math.PI * 0.21 * t + ni);
      const s = (Math.sin(2 * Math.PI * f * t) + 0.6 * Math.sin(2 * Math.PI * f * 1.003 * t + ni) + 0.25 * Math.sin(2 * Math.PI * f * 2.001 * t)) * vol * env * sw * end * start * lfo;
      add(music, i, s * (1 - pan), s * (1 + pan));
    }
  });
});

const BEAT = 60 / 84;
function bell(buf, t, m, v, decay = 1.6, pan = 0) {
  const f = hz(m), i0 = Math.round(t * SR), len = Math.round(decay * 2.5 * SR);
  for (let j = 0; j < len; j++) {
    const tt = j / SR, env = Math.min(1, tt / 0.004) * Math.exp(-tt / (decay * 0.45));
    const s = (Math.sin(2 * Math.PI * f * tt) + 0.3 * Math.sin(2 * Math.PI * f * 2 * tt) * Math.exp(-tt * 3) + 0.08 * Math.sin(2 * Math.PI * f * 3.01 * tt) * Math.exp(-tt * 6)) * v * env;
    add(buf, i0 + j, s * (1 - pan), s * (1 + pan));
  }
}
// A soft pulse, one felt note per beat, chord tones climbing, up to the payoff.
for (let t = 0.7, n = 0; t < D0 - 0.2; t += BEAT, n++) {
  const ns = chordAt(t).notes.filter(m => m >= 62);
  bell(music, t, ns[n % ns.length] + 12 * (n % 4 === 3 ? 1 : 0), 0.018, 1.0, ((n % 3) - 1) * 0.35);
}

// Breaths: band-limited noise with a moving centre, for rises, pushes and drops.
function breath(t, dur, v, f0, f1, pan = 0) {
  const i0 = Math.round(t * SR), len = Math.round(dur * SR);
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

// Each scene's phone: up as it opens, away as it closes. Quieter than a
// reel's single rise, because here they come every few seconds.
P.scenes.forEach((s, i) => {
  if (!s.phones.length) return;
  const pan = s.phones.length > 1 ? 0 : s.phones[0].x < 960 ? -0.3 : 0.3;
  if (i) breath(s.t[0] - 0.1, 0.8, 0.13, 400, 2200, pan);
  breath(s.t[1] - 0.45, 0.6, 0.09, 2000, 400, pan);
});
// The events captured in each scene, on the promo's clock and only while
// that scene is on screen.
P.scenes.forEach(s => s.phones.forEach(ph => {
  const E = JSON.parse(fs.readFileSync(`events-${ph.cap}.json`)), sh = ph.shift || 0;
  const live = t => t >= s.t[0] + 0.3 && t < s.t[1] - 0.3, pan = ph.x < 960 ? -0.15 : 0.15;
  E.taps.forEach(tp => {
    const t = tp.t + sh; if (!live(t)) return;
    const ns = chordAt(t).notes.filter(m => m >= 62);
    bell(fx, t, ns[ns.length - 1] + 12, 0.045, 0.7, pan);
  });
  E.pushes.forEach(pu => { const t = pu.t + sh; if (live(t)) breath(t + 0.02, 0.4, 0.12, 1800, 700, pan); });
  // a drag: a long, low lift for as long as the finger carries the plant
  E.drags.forEach(dg => { const t = dg.t0 + sh; if (live(t)) breath(t, dg.t1 - dg.t0 + 0.2, 0.08, 500, 1400, pan); });
  Object.entries(E.rings).forEach(([id, fr]) => {
    if ((s.lifts || []).some(l => l.ring === id)) return;
    const t = Math.min(...Object.keys(fr).map(Number)) / 30 + sh; if (!live(t)) return;
    const r = chordAt(t).notes[0] + 24;
    bell(fx, t, r + 7, 0.045, 1.6, -0.2); bell(fx, t + 0.16, r + 12, 0.04, 1.8, 0.2);
  });
  // lifted cards: two notes as each card comes off its screen
  (s.lifts || []).filter(l => l.cap === ph.cap).forEach(l => {
    const r = chordAt(l.at).notes[0] + 24;
    bell(fx, l.at + 0.1, r + 4, 0.05, 1.6, pan); bell(fx, l.at + 0.26, r + 7, 0.045, 1.8, pan);
  });
}));
// Captions: a very quiet low note as each line lands, so none lands with a click.
P.captions.forEach(c => (c.lineAt || [c.t[0]]).forEach(t => bell(fx, t, chordAt(t).notes[1] + 12, 0.022, 1.4)));
// Payoff: the lockup arrives on the full chord, then the store line.
[62, 66, 69, 74, 76].forEach((m, i) => bell(fx, D0 + 0.3 + i * 0.07, m + 12, 0.045, 2.6, (i - 2) * 0.2));
bell(fx, P.end.play, 81, 0.035, 2.2, 0.1);

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
let peak = 0; const mix = new Float32Array(N * 2);
for (let i = 0; i < N; i++) {
  mix[i * 2] = music[0][i] + fx[0][i] * 0.8 + wet[0][i] * 0.55;
  mix[i * 2 + 1] = music[1][i] + fx[1][i] * 0.8 + wet[1][i] * 0.55;
  peak = Math.max(peak, Math.abs(mix[i * 2]), Math.abs(mix[i * 2 + 1]));
}
const g = 0.85 / peak;
mix.forEach((v, i) => L[i] = Math.max(-32767, Math.min(32767, Math.tanh(v * g) * 32767)));
const hdr = Buffer.alloc(44);
hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + L.length * 2, 4); hdr.write('WAVE', 8); hdr.write('fmt ', 12);
hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22); hdr.writeUInt32LE(SR, 24);
hdr.writeUInt32LE(SR * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(L.length * 2, 40);
fs.writeFileSync('music.wav', Buffer.concat([hdr, Buffer.from(L.buffer)]));
console.log('music.wav', DUR, 's, chords', chords.map(c => c.t).join(' '));
