const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050;

function createWavHeader(sampleCount, sampleRate = SAMPLE_RATE) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = sampleCount * numChannels * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44);

  // RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // "fmt " sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // "data" sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

function writePcmWav(filename, samples) {
  const header = createWavHeader(samples.length);
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.floor(s * 32767), i * 2);
  }
  const fullBuffer = Buffer.concat([header, data]);
  fs.writeFileSync(filename, fullBuffer);
  console.log(`Wrote ${filename} (${fullBuffer.length} bytes)`);
}

// Ensure assets/sounds directory exists
const targetDir = path.join(__dirname, '..', 'assets', 'sounds');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 1. Swipe: quick smooth upward whoosh
function genSwipe() {
  const duration = 0.14;
  const totalSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalSamples);
  let phase = 0;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / totalSamples;
    const freq = 300 + 260 * t;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const env = Math.sin(Math.PI * t); // smooth bell envelope
    samples[i] = Math.sin(phase) * env * 0.45;
  }
  return samples;
}

// 2. Correct: Bright 3-note ascending chime
function genCorrect() {
  const notes = [
    { freq: 523.25, start: 0.00, dur: 0.12 }, // C5
    { freq: 659.25, start: 0.08, dur: 0.14 }, // E5
    { freq: 783.99, start: 0.16, dur: 0.28 }, // G5
  ];
  const totalDuration = 0.46;
  const totalSamples = Math.floor(SAMPLE_RATE * totalDuration);
  const samples = new Float32Array(totalSamples);

  for (const n of notes) {
    const startSample = Math.floor(n.start * SAMPLE_RATE);
    const noteSamples = Math.floor(n.dur * SAMPLE_RATE);
    for (let i = 0; i < noteSamples; i++) {
      const idx = startSample + i;
      if (idx >= totalSamples) break;
      const t = i / noteSamples;
      const decay = Math.exp(-4 * t);
      const s = (Math.sin(2 * Math.PI * n.freq * (i / SAMPLE_RATE)) +
                 0.3 * Math.sin(4 * Math.PI * n.freq * (i / SAMPLE_RATE))) * decay * 0.35;
      samples[idx] += s;
    }
  }
  return samples;
}

// 3. Wrong: 2-tone descending thud
function genWrong() {
  const notes = [
    { freq: 220.00, start: 0.00, dur: 0.12 }, // A3
    { freq: 164.81, start: 0.09, dur: 0.22 }, // E3
  ];
  const totalDuration = 0.34;
  const totalSamples = Math.floor(SAMPLE_RATE * totalDuration);
  const samples = new Float32Array(totalSamples);

  for (const n of notes) {
    const startSample = Math.floor(n.start * SAMPLE_RATE);
    const noteSamples = Math.floor(n.dur * SAMPLE_RATE);
    for (let i = 0; i < noteSamples; i++) {
      const idx = startSample + i;
      if (idx >= totalSamples) break;
      const t = i / noteSamples;
      const decay = Math.exp(-5 * t);
      // Sawtooth-like harmonic warmth
      const s = (Math.sin(2 * Math.PI * n.freq * (i / SAMPLE_RATE)) +
                 0.5 * Math.sin(4 * Math.PI * n.freq * (i / SAMPLE_RATE)) +
                 0.25 * Math.sin(6 * Math.PI * n.freq * (i / SAMPLE_RATE))) * decay * 0.32;
      samples[idx] += s;
    }
  }
  return samples;
}

// 4. Combo: 4-tone ascending fanfare
function genCombo() {
  const notes = [
    { freq: 440.00, start: 0.00, dur: 0.09 }, // A4
    { freq: 554.37, start: 0.07, dur: 0.09 }, // C#5
    { freq: 659.25, start: 0.14, dur: 0.11 }, // E5
    { freq: 880.00, start: 0.21, dur: 0.30 }, // A5
  ];
  const totalDuration = 0.54;
  const totalSamples = Math.floor(SAMPLE_RATE * totalDuration);
  const samples = new Float32Array(totalSamples);

  for (const n of notes) {
    const startSample = Math.floor(n.start * SAMPLE_RATE);
    const noteSamples = Math.floor(n.dur * SAMPLE_RATE);
    for (let i = 0; i < noteSamples; i++) {
      const idx = startSample + i;
      if (idx >= totalSamples) break;
      const t = i / noteSamples;
      const decay = Math.exp(-3.5 * t);
      const s = (Math.sin(2 * Math.PI * n.freq * (i / SAMPLE_RATE)) +
                 0.35 * Math.sin(4 * Math.PI * n.freq * (i / SAMPLE_RATE))) * decay * 0.32;
      samples[idx] += s;
    }
  }
  return samples;
}

// 5. Complete: Round complete fanfare (C5, E5, G5, C6)
function genComplete() {
  const notes = [
    { freq: 523.25, start: 0.00, dur: 0.11 }, // C5
    { freq: 659.25, start: 0.09, dur: 0.11 }, // E5
    { freq: 783.99, start: 0.18, dur: 0.13 }, // G5
    { freq: 1046.50, start: 0.27, dur: 0.42 }, // C6
  ];
  const totalDuration = 0.72;
  const totalSamples = Math.floor(SAMPLE_RATE * totalDuration);
  const samples = new Float32Array(totalSamples);

  for (const n of notes) {
    const startSample = Math.floor(n.start * SAMPLE_RATE);
    const noteSamples = Math.floor(n.dur * SAMPLE_RATE);
    for (let i = 0; i < noteSamples; i++) {
      const idx = startSample + i;
      if (idx >= totalSamples) break;
      const t = i / noteSamples;
      const decay = Math.exp(-3 * t);
      const s = (Math.sin(2 * Math.PI * n.freq * (i / SAMPLE_RATE)) +
                 0.4 * Math.sin(4 * Math.PI * n.freq * (i / SAMPLE_RATE)) +
                 0.2 * Math.sin(6 * Math.PI * n.freq * (i / SAMPLE_RATE))) * decay * 0.32;
      samples[idx] += s;
    }
  }
  return samples;
}

writePcmWav(path.join(targetDir, 'swipe.wav'), genSwipe());
writePcmWav(path.join(targetDir, 'correct.wav'), genCorrect());
writePcmWav(path.join(targetDir, 'wrong.wav'), genWrong());
writePcmWav(path.join(targetDir, 'combo.wav'), genCombo());
writePcmWav(path.join(targetDir, 'complete.wav'), genComplete());
console.log('All 5 sound assets generated successfully!');
