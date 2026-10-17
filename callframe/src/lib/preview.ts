import type { Project } from '../types';
import type { SpeakingInterval } from '../types';

/**
 * Client-side preview engine.
 *
 * Decodes uploaded audio files with the Web Audio API and schedules them with
 * their timeline offsets so the preview preserves the original timing and pauses
 * without mixing the conversation into a single track beforehand.
 */
export class PreviewEngine {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private sources: AudioBufferSourceNode[] = [];
  private startTime = 0; // AudioContext time when playback began
  private playing = false;
  private onTime: ((t: number) => void) | null = null;
  private raf: number | null = null;

  get isPlaying() { return this.playing; }
  get currentTime() { return this.ctx ? this.ctx.currentTime - this.startTime : 0; }

  async ensureContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
  }

  async load(id: string, arrayBuffer: ArrayBuffer) {
    await this.ensureContext();
    const buffer = await this.ctx!.decodeAudioData(arrayBuffer);
    this.buffers.set(id, buffer);
    return buffer.duration;
  }

  has(id: string) { return this.buffers.has(id); }
  duration(id: string) { return this.buffers.get(id)?.duration ?? 0; }

  private stopAll() {
    for (const src of this.sources) {
      try { src.stop(0); } catch { /* already stopped */ }
      try { src.disconnect(); } catch { /* */ }
    }
    this.sources = [];
    this.playing = false;
    if (this.raf !== null) { cancelAnimationFrame(this.raf); this.raf = null; }
  }

  stop() {
    this.stopAll();
    this.startTime = 0;
  }

  /** Schedule every timeline event at its configured position and play. */
  async play(
    project: Project,
    ringBuffer: AudioBuffer | null,
    connectedBuffer: AudioBuffer | null,
    onTime: (t: number) => void
  ) {
    await this.ensureContext();
    this.stopAll();
    this.onTime = onTime;

    const ev = timelineEventsLocal(project);
    const base = this.ctx!.currentTime + 0.08;
    const gain = this.ctx!.createGain();
    gain.connect(this.ctx!.destination);

    const schedule = (buffer: AudioBuffer | null, when: number, offsetInBuffer = 0, volume = 1) => {
      if (!buffer) return;
      const src = this.ctx!.createBufferSource();
      src.buffer = buffer;
      const g = this.ctx!.createGain();
      g.gain.value = volume;
      src.connect(g).connect(gain);
      src.start(when, offsetInBuffer);
      this.sources.push(src);
      return src;
    };

    // Outgoing ring
    schedule(ringBuffer, base + ev.ringStart, 0, project.effects.find(e => e.type === 'outgoing-ring')?.volume ?? 1);
    // Connected / answer sound
    schedule(connectedBuffer, base + ev.connectedStart, 0, project.effects.find(e => e.type === 'connected')?.volume ?? 1);
    // Participant tracks (offsets applied inside the timeline)
    const aVol = project.participants.a.volume;
    const bVol = project.participants.b.volume;
    schedule(this.buffers.get(project.participants.a.audio?.id ?? ''), base + ev.conversationStart + project.participants.a.offset, 0, aVol);
    schedule(this.buffers.get(project.participants.b.audio?.id ?? ''), base + ev.conversationStart + project.participants.b.offset, 0, bVol);
    // Call-ended sound
    const ended = project.effects.find(e => e.type === 'ended');
    schedule(ended?.file ? this.buffers.get(ended.file.id) ?? null : null, base + ev.endedStart, 0, ended?.volume ?? 1);

    this.startTime = base;
    this.playing = true;
    this.tick();
  }

  /** Seek playback to timeline time t (seconds). Sources restart at `now`. */
  seek(
    t: number,
    project: Project,
    ringBuffer: AudioBuffer | null,
    connectedBuffer: AudioBuffer | null
  ) {
    if (!this.ctx) return;
    this.stopAll();
    this.onTime = undefined;
    const ev = timelineEventsLocal(project);
    const base = this.ctx.currentTime + 0.05;
    const gain = this.ctx.createGain();
    gain.connect(this.ctx.destination);

    const scheduleIf = (buffer: AudioBuffer | null, eventStart: number, volume = 1) => {
      if (!buffer || t < eventStart) return;
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const g = this.ctx.createGain();
      g.gain.value = volume;
      src.connect(g).connect(gain);
      src.start(base, t - eventStart);
      this.sources.push(src);
    };

    scheduleIf(ringBuffer, ev.ringStart);
    scheduleIf(connectedBuffer, ev.connectedStart);
    const aId = project.participants.a.audio?.id;
    const bId = project.participants.b.audio?.id;
    const aStart = ev.conversationStart + project.participants.a.offset;
    const bStart = ev.conversationStart + project.participants.b.offset;
    if (aId) scheduleIf(this.buffers.get(aId) ?? null, aStart, project.participants.a.volume);
    if (bId) scheduleIf(this.buffers.get(bId) ?? null, bStart, project.participants.b.volume);
    const ended = project.effects.find(e => e.type === 'ended');
    if (ended?.file) scheduleIf(this.buffers.get(ended.file.id) ?? null, ev.endedStart, ended.volume);

    this.startTime = base - t;
    this.playing = true;
    this.tick();
  }

  private tick() {
    if (!this.playing) return;
    if (this.onTime) this.onTime(this.currentTime);
    this.raf = requestAnimationFrame(() => this.tick());
  }

  /** Play a single asset in isolation (asset preview). */
  async playSolo(buffer: AudioBuffer | null, volume = 1) {
    await this.ensureContext();
    this.stopAll();
    if (!buffer) return;
    const gain = this.ctx!.createGain();
    gain.connect(this.ctx!.destination);
    const src = this.ctx!.createBufferSource();
    src.buffer = buffer;
    const g = this.ctx!.createGain();
    g.gain.value = volume;
    src.connect(g).connect(gain);
    src.start();
    this.sources.push(src);
    this.playing = true;
    src.onended = () => { this.playing = false; };
  }
}

function timelineEventsLocal(project: Project) {
  const ringDuration = project.ringDuration;
  const connectedDuration = project.connectedDuration;
  const ringStart = 0;
  const connectedStart = ringDuration;
  const conversationStart = connectedStart + connectedDuration;
  const aEnd = (project.participants.a.audio?.duration ?? 0) + project.participants.a.offset;
  const bEnd = (project.participants.b.audio?.duration ?? 0) + project.participants.b.offset;
  const conversationEnd = conversationStart + Math.max(aEnd, bEnd);
  const endedStart = conversationEnd;
  return { ringStart, connectedStart, conversationStart, conversationEnd, endedStart };
}
