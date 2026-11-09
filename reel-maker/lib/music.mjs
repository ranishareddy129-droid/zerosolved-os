// Procedural, royalty-free music bed for Zerosolved reels.
// Driving minimal-tech track: pad + bass + arp + four-on-the-floor,
// with a whoosh into every scene cut and an impact on the cut.
// Output: 16-bit stereo WAV buffer. Loudness is normalised later by ffmpeg.

const NOTE = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// Chord = [root midi, quality]. Default progression: Am – F – C – G.
const QUAL = { min: [0, 3, 7, 12], maj: [0, 4, 7, 12] };

function parseChord(name) {
  const m = /^([A-G]#?)(m?)$/.exec(name.trim());
  if (!m) throw new Error("Bad chord " + name);
  return { root: NOTE[m[1]], q: m[2] ? "min" : "maj" };
}

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
}

export function makeMusic({ duration, cuts = [], bpm = 120, seed = 7, progression = ["Am", "F", "C", "G"], endAt = null, sr = 44100 }) {
  const N = Math.ceil((duration + 0.5) * sr);
  const L = new Float32Array(N), R = new Float32Array(N);
  const noise = rng(seed);
  const beat = 60 / bpm, bar = beat * 4;
  const chords = progression.map(parseChord);
  const drumsFrom = cuts.length > 1 ? cuts[1] : 2 * bar; // drums enter on the first cut
  const outro = endAt ?? (cuts.length ? cuts[cuts.length - 1] : duration - 6);
  const chordAt = (t) => chords[Math.floor(t / bar) % chords.length];

  const add = (buf, i, v) => { if (i >= 0 && i < N) buf[i] += v; };
  const addSt = (i, v, pan = 0) => { add(L, i, v * (1 - pan) ); add(R, i, v * (1 + pan)); };

  // ---- sidechain envelope from kicks ----
  const kickTimes = [];
  for (let t = drumsFrom; t < duration; t += beat) {
    const inOutro = t >= outro;
    if (inOutro && Math.round((t - outro) / beat) % 4 !== 0) continue; // outro: kick on bar downbeats only
    if (t > duration - 1.5) break;
    kickTimes.push(t);
  }
  const duck = new Float32Array(N).fill(1);
  for (const kt of kickTimes) {
    const s = Math.floor(kt * sr);
    for (let j = 0; j < sr * 0.4; j++) {
      const g = 1 - 0.65 * Math.exp(-j / sr / 0.11);
      if (s + j < N) duck[s + j] = Math.min(duck[s + j], g);
    }
  }

  // ---- pad (detuned saws, one-pole LP, sidechained) ----
  {
    let lpL = 0, lpR = 0;
    const ph = new Float64Array(8);
    for (let i = 0; i < N; i++) {
      const t = i / sr;
      const c = chordAt(t);
      const notes = QUAL[c.q].slice(0, 3).map((n) => 57 + ((c.root - 9 + 12) % 12) + n); // around A3
      let sL = 0, sR = 0;
      notes.forEach((m, k) => {
        const f = hz(m);
        ph[k * 2] += (f * 1.003) / sr; ph[k * 2 + 1] += (f * 0.997) / sr;
        sL += 2 * (ph[k * 2] % 1) - 1;
        sR += 2 * (ph[k * 2 + 1] % 1) - 1;
      });
      const cutoff = 700 + 500 * Math.sin(t * 0.35) + (t < drumsFrom ? -250 : 0);
      const a = 1 - Math.exp((-2 * Math.PI * cutoff) / sr);
      lpL += a * (sL - lpL); lpR += a * (sR - lpR);
      const fadeIn = Math.min(1, t / 1.2);
      const g = 0.055 * fadeIn * duck[i];
      L[i] += lpL * g; R[i] += lpR * g;
    }
  }

  // ---- bass (8th-note plucks, from first cut) ----
  {
    let lp = 0, ph = 0;
    for (let i = Math.floor(drumsFrom * sr); i < N; i++) {
      const t = i / sr;
      if (t >= outro) break;
      const c = chordAt(t);
      const stepT = (t - drumsFrom) % (beat / 2);
      const step = Math.floor((t - drumsFrom) / (beat / 2));
      const midi = 33 + ((c.root - 9 + 12) % 12) + (step % 4 === 3 ? 12 : 0); // A1 region, octave pop
      ph += hz(midi + 12) / sr;
      const saw = 2 * (ph % 1) - 1;
      const env = Math.exp(-stepT / 0.16);
      const a = 1 - Math.exp((-2 * Math.PI * (250 + 900 * env)) / sr);
      lp += a * (saw - lp);
      const v = lp * env * 0.32 * (0.35 + 0.65 * duck[i]);
      L[i] += v; R[i] += v;
    }
  }

  // ---- arp (16th plucks over chord tones, with ping-pong delay) ----
  {
    const arpL = new Float32Array(N), arpR = new Float32Array(N);
    const s16 = beat / 4;
    const start = drumsFrom + 2 * bar > outro ? drumsFrom : drumsFrom + bar; // arp joins one bar after drums
    const pattern = [0, 1, 2, 3, 2, 1, 2, 3];
    for (let t = start, k = 0; t < duration - 1; t += s16, k++) {
      const c = chordAt(t);
      const tones = QUAL[c.q];
      const midi = 69 + ((c.root - 9 + 12) % 12) + tones[pattern[k % pattern.length]];
      const f = hz(midi);
      const s0 = Math.floor(t * sr), len = Math.floor(sr * 0.22);
      let ph = 0, lp = 0;
      const vel = k % 4 === 0 ? 1 : 0.7;
      for (let j = 0; j < len; j++) {
        ph += f / sr;
        const sq = (ph % 1) < 0.5 ? 1 : -1;
        const env = Math.exp(-j / sr / 0.075);
        const a = 1 - Math.exp((-2 * Math.PI * (900 + 3500 * env)) / sr);
        lp += a * (sq - lp);
        const v = lp * env * 0.05 * vel;
        add(arpL, s0 + j, v * 0.8); add(arpR, s0 + j, v * 1.2);
      }
    }
    // ping-pong delay (3/16)
    const d = Math.floor(sr * beat * 0.75);
    for (let i = d; i < N; i++) {
      arpL[i] += arpR[i - d] * 0.38;
      arpR[i] += arpL[i - d] * 0.38;
    }
    for (let i = 0; i < N; i++) { L[i] += arpL[i]; R[i] += arpR[i]; }
  }

  // ---- drums ----
  for (const kt of kickTimes) {
    const s0 = Math.floor(kt * sr);
    let ph = 0;
    for (let j = 0; j < sr * 0.45; j++) {
      const tt = j / sr;
      const f = 46 + 120 * Math.exp(-tt / 0.035);
      ph += f / sr;
      const v = Math.sin(2 * Math.PI * ph) * Math.exp(-tt / 0.3) * 0.55 + (j < 60 ? noise() * 0.15 * (1 - j / 60) : 0);
      add(L, s0 + j, v); add(R, s0 + j, v);
    }
  }
  {
    // hats: closed 16ths (quiet), open on off-beats; clap on 2 & 4
    let hpPrev = 0, hpOut = 0;
    const hatBuf = new Float32Array(N);
    for (let t = drumsFrom; t < Math.min(outro, duration - 1); t += beat / 4) {
      const k = Math.round((t - drumsFrom) / (beat / 4));
      const open = k % 4 === 2;
      const s0 = Math.floor(t * sr), len = Math.floor(sr * (open ? 0.16 : 0.035));
      const vel = open ? 0.11 : k % 2 ? 0.03 : 0.045;
      for (let j = 0; j < len; j++) hatBuf[s0 + j] += noise() * Math.exp(-j / sr / (open ? 0.05 : 0.012)) * vel;
    }
    for (let i = 0; i < N; i++) { // high-pass
      hpOut = 0.92 * (hpOut + hatBuf[i] - hpPrev); hpPrev = hatBuf[i];
      L[i] += hpOut * 0.9; R[i] += hpOut * 1.1;
    }
    for (let t = drumsFrom + beat; t < Math.min(outro, duration - 1); t += beat * 2) {
      const s0 = Math.floor(t * sr);
      let lp = 0, hp = 0, prev = 0;
      for (let j = 0; j < sr * 0.18; j++) {
        const x = noise();
        lp += 0.35 * (x - lp);
        hp = 0.9 * (hp + lp - prev); prev = lp;
        const env = Math.exp(-j / sr / 0.07) * (j < sr * 0.012 ? 1.4 : 1);
        const v = hp * env * 0.22;
        add(L, s0 + j, v); add(R, s0 + j, v);
      }
    }
  }

  // ---- transitions: whoosh into each cut, impact on each cut ----
  cuts.slice(1).forEach((ct, idx) => {
    const big = idx === cuts.length - 2 || idx === 0; // first drop & end card hit harder
    const wl = big ? 1.6 : 0.5;
    const s0 = Math.floor((ct - wl) * sr), len = Math.floor(wl * sr);
    let lp = 0;
    for (let j = 0; j < len; j++) {
      const p = j / len;
      const a = 1 - Math.exp((-2 * Math.PI * (300 + 6000 * p * p)) / sr);
      lp += a * (noise() - lp);
      const v = lp * Math.pow(p, 2) * (big ? 0.28 : 0.16);
      add(L, s0 + j, v * (1 - 0.5 * Math.sin(p * 9))); add(R, s0 + j, v * (1 + 0.5 * Math.sin(p * 9)));
    }
    const c0 = Math.floor(ct * sr);
    let ph = 0, nlp = 0;
    for (let j = 0; j < sr * (big ? 1.2 : 0.5); j++) {
      const tt = j / sr;
      ph += (38 + 30 * Math.exp(-tt / 0.08)) / sr;
      nlp += 0.08 * (noise() - nlp);
      const v = (Math.sin(2 * Math.PI * ph) * 0.5 + nlp * 0.9) * Math.exp(-tt / (big ? 0.45 : 0.18)) * (big ? 0.6 : 0.3);
      add(L, c0 + j, v); add(R, c0 + j, v);
    }
  });

  // ---- master: soft clip, fade out, normalise ----
  let peak = 0;
  const fadeStart = duration - 1.6;
  for (let i = 0; i < N; i++) {
    const t = i / sr;
    const g = t > fadeStart ? Math.max(0, 1 - (t - fadeStart) / 1.6) : 1;
    L[i] = Math.tanh(L[i] * 1.2) * g; R[i] = Math.tanh(R[i] * 1.2) * g;
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
  const norm = peak > 0 ? 0.89 / peak : 1;

  const total = Math.floor(duration * sr);
  const buf = Buffer.alloc(44 + total * 4);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + total * 4, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(total * 4, 40);
  for (let i = 0; i < total; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm)) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm)) * 32767), 46 + i * 4);
  }
  return buf;
}
