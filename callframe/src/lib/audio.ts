import type { SpeakingInterval } from '../types';

/**
 * Decode an ArrayBuffer into an AudioBuffer using the AudioContext.
 */
export function decodeAudio(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioContext();
  return ctx.decodeAudioData(arrayBuffer).finally(() => {
    if (ctx.state !== 'closed') ctx.close();
  });
}

/**
 * Voice-activity analysis of a single track.
 *
 * Returns speaking intervals [start, end] in seconds, relative to the track start,
 * with attack/release smoothing, minimum speaking duration, and gap merging so the
 * green ring does not flicker on brief clicks or pauses.
 */
export function analyzeSpeaking(
  buffer: AudioBuffer,
  opts: { sensitivity: number; minSpeakingSec: number; minGapSec: number }
): SpeakingInterval[] {
  const { sensitivity = 0.5, minSpeakingSec = 0.3, minGapSec = 0.2 } = opts;
  const channelCount = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;

  // Mix down to mono and compute short-time RMS energy.
  const windowSize = 512; // ~12 ms at 44.1 kHz
  const hop = windowSize;
  const rms: { t: number; v: number }[] = [];
  for (let i = 0; i + hop <= length; i += hop) {
    let sum = 0;
    for (let c = 0; c < channelCount; c++) {
      const ch = buffer.getChannelData(c);
      for (let j = 0; j < hop; j++) {
        const v = ch[i + j];
        sum += v * v;
      }
    }
    rms.push({ t: i / sampleRate, v: Math.sqrt(sum / (hop * channelCount)) });
  }
  if (rms.length === 0) return [];

  let maxRms = 0;
  for (const r of rms) if (r.v > maxRms) maxRms = r.v;
  if (maxRms <= 0) return [];

  // Map sensitivity (0..1) to a threshold ratio of peak energy.
  const thresholdRatio = 0.05 + (1 - sensitivity) * 0.45; // 0.05 .. 0.5
  const threshold = maxRms * thresholdRatio;

  // Attack/release smoothing of the energy envelope.
  const attack = 0.5;
  const release = 0.15;
  let smoothed = 0;
  const active: boolean[] = [];
  for (const r of rms) {
    smoothed = r.v > smoothed ? smoothed + attack * (r.v - smoothed) : smoothed + release * (r.v - smoothed);
    active.push(smoothed > threshold);
  }

  // Convert boolean windows into intervals, applying hysteresis.
  const intervals: SpeakingInterval[] = [];
  let i = 0;
  const n = active.length;
  while (i < n) {
    if (!active[i]) { i++; continue; }
    let start = rms[i].t;
    let j = i;
    let silentFrames = 0;
    while (j < n) {
      if (active[j]) {
        silentFrames = 0;
      } else {
        silentFrames++;
        if (silentFrames * hop / sampleRate > minGapSec) break;
      }
      j++;
    }
    const end = rms[Math.max(i, j - 1)].t;
    if (end - start >= minSpeakingSec) {
      intervals.push({ start, end });
    }
    i = j;
  }

  // Merge any remaining tiny gaps and drop ultra-short remnants.
  const merged: SpeakingInterval[] = [];
  for (const iv of intervals) {
    const last = merged[merged.length - 1];
    if (last && iv.start - last.end < minGapSec) last.end = iv.end;
    else merged.push({ ...iv });
  }
  return merged.filter((iv) => iv.end - iv.start >= minSpeakingSec * 0.5);
}

/** Speaking state of a track at absolute timeline time t. */
export function isSpeakingAt(intervals: SpeakingInterval[], trackStart: number, t: number): boolean {
  const trackTime = t - trackStart;
  return intervals.some((iv) => trackTime >= iv.start && trackTime <= iv.end);
}
