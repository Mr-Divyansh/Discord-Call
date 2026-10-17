import type { Project, MediaFile, ExportSettings } from '../types';
import { timelineEvents } from './project';

/** Convert a data URL to a Uint8Array. */
export function dataUrlToBytes(dataUrl: string): Promise<Uint8Array> {
  const base64 = dataUrl.split(',')[1]!;
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return Promise.resolve(bytes);
}

/** Load an image from a data URL into an HTMLImageElement. */
export function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/** Escape text for ffmpeg drawtext. */
export function escapeDrawText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:').replace(/%/g, '%');
}

/**
 * Render a participant avatar as a circle (idle or with green speaking ring).
 * Returns a PNG data URL sized for high-quality export.
 */
export function renderAvatarCircle(
  img: HTMLImageElement | null,
  speaking: boolean,
  size = 512
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, size, size);

    const r = size / 2;
    const cx = r, cy = r;
    const pad = 10;
    const inner = r - pad;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    if (img) {
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    } else {
      ctx.fillStyle = '#23262b';
      ctx.fillRect(cx - inner, cy - inner, inner * 2, inner * 2);
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#101216';
    ctx.stroke();

    if (speaking) {
      ctx.beginPath();
      ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
      ctx.lineWidth = 14;
      ctx.strokeStyle = 'rgba(59, 165, 93, 0.55)';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, r + 1, 0, Math.PI * 2);
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#3ba55d';
      ctx.stroke();
    }

    resolve(canvas.toDataURL('image/png'));
  });
}
function quoteDrawText(text: string): string {
  return `text='${escapeDrawText(text)}'`;
}

export function buildRenderArgs(
  project: Project,
  inputs: RenderInputs,
  tmpDir = '.'
): string[] {
  const { width, height, fps, crf, audioBitrate } = project.exportSettings;
  const ev = timelineEvents(project);
  const duration = ev.duration;

  const a = project.participants.a;
  const b = project.participants.b;

  // geometry: two avatar circles
  const avatarD = Math.round(height * 0.30);
  const gap = Math.round(height * 0.07);
  const cx = width / 2;
  const xA = Math.round(cx - avatarD - gap / 2);
  const xB = Math.round(cx + gap / 2);
  const y = Math.round(height / 2 - avatarD / 2 - height * 0.04);
  const nameY = Math.round(y + avatarD + 26);
  const nameSize = height * 0.055;

  const args: string[] = ['-nostdin', '-y'];

  // video source: solid Discord-ish background for the full duration
  args.push('-f', 'lavfi', '-i', `color=c=#2f3136:s=${width}x${height}:r=${fps}:d=${duration}`);

  // image inputs: aIdle(1), aSpeaking(2), bIdle(3), bSpeaking(4)
  const images: MediaFile[] = [inputs.aIdle, inputs.aSpeaking, inputs.bIdle, inputs.bSpeaking];
  for (const img of images) args.push('-i', img.dataUrl);

  // optional audio inputs
  const audioInputs: MediaFile[] = [];
  const pushAudio = (m?: MediaFile) => { if (m) audioInputs.push(m); };
  pushAudio(inputs.audioA);
  pushAudio(inputs.audioB);
  pushAudio(inputs.ring);
  pushAudio(inputs.connected);
  pushAudio(inputs.ended);
  for (const m of audioInputs) args.push('-i', m.dataUrl);

  // filter complex
  const fcParts: string[] = [];
  fcParts.push(`[0:v]trim=duration=${duration},setpts=PTS-STARTPTS,fps=${fps},format=yuv420p[base]`);

  fcParts.push(`[base][1:v]overlay=x=${xA}:y=${y}:format=auto[ov1]`);
  fcParts.push(`[ov1][3:v]overlay=x=${xB}:y=${y}:format=auto[ov2]`);

  const aIntervals = speakingIntervalTimes(a, ev);
  const bIntervals = speakingIntervalTimes(b, ev);
  if (aIntervals) fcParts.push(`[ov2][2:v]overlay=x=${xA}:y=${y}:enable='${aIntervals}':format=auto[ov3]`);
  else fcParts.push(`[ov2]copy[ov3]`);
  if (bIntervals) fcParts.push(`[ov3][4:v]overlay=x=${xB}:y=${y}:enable='${bIntervals}':format=auto[ov4]`);
  else fcParts.push(`[ov3]copy[ov4]`);

  fcParts.push(drawTextArg('[ov4]', '[nA]', a.displayName, Math.round(xA + avatarD / 2 - a.displayName.length * 5.6), nameY, nameSize));
  fcParts.push(drawTextArg('[nA]', '[nB]', b.displayName, Math.round(xB + avatarD / 2 - b.displayName.length * 5.6), nameY, nameSize));

  const stateX = Math.round(width / 2 - 90);
  const fs = Math.round(height * 0.045);
  fcParts.push(`[nB]drawtext=${quoteDrawText('Ringing')}:x=${stateX}:y=40:fontsize=${fs}:fontcolor=white:enable='between(t,0,${ev.ringEnd})'[s1]`);
  fcParts.push(`[s1]drawtext=${quoteDrawText('Connected')}:x=${stateX}:y=40:fontsize=${fs}:fontcolor='#3ba55d':enable='between(t,${ev.ringEnd},${ev.conversationStart})'[s2]`);
  fcParts.push(`[s2]drawtext=${quoteDrawText('Call ended')}:x=${stateX}:y=40:fontsize=${fs}:fontcolor=white:enable='gte(t,${ev.conversationEnd})'[vid]`);

  // audio chain
  let idx = 5; // input index after color + 4 images
  const afParts: string[] = [];
  const addAF = (m: MediaFile | undefined, gainVol: number, delaySec: number, tag: string) => {
    if (!m) return;
    afParts.push(`[${idx}:a]volume=${gainVol},adelay=${Math.round(delaySec * 1000)}|${Math.round(delaySec * 1000)}[${tag}];`);
    idx++;
  };
  addAF(inputs.audioA, a.volume, ev.conversationStart + a.offset, 'aA');
  addAF(inputs.audioB, b.volume, ev.conversationStart + b.offset, 'aB');
  addAF(inputs.ring, project.effects.find(e => e.type === 'outgoing-ring')?.volume ?? 1, ev.ringStart, 'ar');
  addAF(inputs.connected, project.effects.find(e => e.type === 'connected')?.volume ?? 1, ev.connectedStart, 'ac');
  addAF(inputs.ended, project.effects.find(e => e.type === 'ended')?.volume ?? 1, ev.endedStart, 'ae');

  const presentTags: string[] = [];
  if (inputs.audioA) presentTags.push('[aA]');
  if (inputs.audioB) presentTags.push('[aB]');
  if (inputs.ring) presentTags.push('[ar]');
  if (inputs.connected) presentTags.push('[ac]');
  if (inputs.ended) presentTags.push('[ae]');

  if (presentTags.length > 0) {
    afParts.push(`${presentTags.join('')}amix=inputs=${presentTags.length}:duration=longest:normalize=0[aout]`);
    args.push('-filter_complex', [...fcParts, ...afParts].join(';'));
    args.push('-map', '[vid]', '-map', '[aout]');
  } else {
    args.push('-filter_complex', fcParts.join(';'));
    args.push('-an');
  }

  args.push(
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', String(fps), '-preset', 'medium', '-crf', String(crf),
    '-c:a', 'aac', '-b:a', audioBitrate, '-movflags', '+faststart', '-t', String(duration),
    `${tmpDir}/output.mp4`
  );
/**
 * Render controller. Runs ffmpeg.wasm in a dedicated worker so the UI stays
 * responsive and cancellation can terminate the worker cleanly.
 */
export class RenderController {
  private worker: Worker | null = null;
  private controller: AbortController | null = null;

  get isRendering() { return this.worker !== null; }

  async startRender(
    project: Project,
    inputs: RenderInputs,
    onEvent: (e: { type: 'log' | 'progress' | 'done' | 'error'; payload: any }) => void
  ): Promise<void> {
    if (this.worker) throw new Error('A render is already in progress');

    this.controller = new AbortController();
    this.worker = new Worker(new URL('../../ffmpeg-worker.ts', import.meta.url), { type: 'module' });

    const handler = (e: MessageEvent) => {
      const msg = e.data as { type: string; [k: string]: any };
      switch (msg.type) {
        case 'LOADED':
          this.writeAllFiles(project, inputs).catch((err) => onEvent({ type: 'error', payload: err.message }));
          break;
        case 'OK':
          break;
        case 'FILE_DATA':
          if (msg.path === 'output.mp4') {
            this.finishRender(msg.data, onEvent);
          }
          break;
        case 'EXEC_OK': {
          if (msg.data !== 0) {
            onEvent({ type: 'error', payload: new Error(`ffmpeg exited with code ${msg.data}`) });
            this.cleanup();
          }
          break;
        }
        case 'LOG':
          onEvent({ type: 'log', payload: msg.data.message ?? String(msg.data) });
          break;
        case 'PROGRESS':
          onEvent({ type: 'progress', payload: { stage: 'encoding', progress: Math.min(Math.max(msg.data.progress ?? 0, 0), 0.95), message: 'encoding…' } });
          break;
        case 'ERROR':
          onEvent({ type: 'error', payload: new Error(msg.data) });
          this.cleanup();
          break;
      }
    };
    this.worker.onmessage = handler;

    this.worker.onerror = (err) => {
      onEvent({ type: 'error', payload: err });
      this.cleanup();
    };

    onEvent({ type: 'progress', payload: { stage: 'loading', progress: 0, message: 'loading ffmpeg.wasm…' } });
    this.worker.postMessage({ type: 'LOAD' });

    // Wait briefly for LOADED before writing files; writeAllFiles is triggered from LOADED.
  }

  private async writeAllFiles(project: Project, inputs: RenderInputs) {
    const write = (path: string, dataUrl: string) =>
      dataUrlToBytes(dataUrl).then((bytes) => {
        this.worker!.postMessage({ type: 'WRITE_FILE', path, data: bytes }, [bytes.buffer]);
      });

    await write('a-idle.png', inputs.aIdle.dataUrl);
    await write('a-speaking.png', inputs.aSpeaking.dataUrl);
    await write('b-idle.png', inputs.bIdle.dataUrl);
    await write('b-speaking.png', inputs.bSpeaking.dataUrl);
    if (inputs.audioA) await write('a.mp3', inputs.audioA.dataUrl);
    if (inputs.audioB) await write('b.mp3', inputs.audioB.dataUrl);
    if (inputs.ring) await write('ring.mp3', inputs.ring.dataUrl);
    if (inputs.connected) await write('connected.mp3', inputs.connected.dataUrl);
    if (inputs.ended) await write('ended.mp3', inputs.ended.dataUrl);

    const args = buildRenderArgs(project, inputs, '.');
    this.worker!.postMessage({ type: 'EXEC', args });
  }

  private finishRender(data: Uint8Array, onEvent: (e: { type: string; payload: any }) => void) {
    const blob = new Blob([data], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    onEvent({ type: 'done', payload: { url, size: data.length } });
    this.cleanup();
  }

  cancel() {
    if (!this.worker) return;
    this.controller?.abort();
    try { this.worker.terminate(); } catch { /* */ }
    this.cleanup();
  }

  private cleanup() {
    this.worker = null;
    this.controller = null;
  }
}

  return args;
}

function speakingIntervalTimes(
  participant: { offset: number; audio: MediaFile & { speakingIntervals?: { start: number; end: number }[] } | null },
  ev: ReturnType<typeof timelineEvents>
): string | null {
  const intervals = participant.audio?.speakingIntervals;
  if (!intervals || intervals.length === 0) return null;
  const trackStart = ev.conversationStart + participant.offset;
  return intervals
    .map((iv) => `between(t,${(trackStart + iv.start).toFixed(3)},${(trackStart + iv.end).toFixed(3)})`)
    .join('+');
}

function drawTextArg(from: string, to: string, text: string, x: number, y: number, fontSize: number): string {
  return `${from}drawtext=${quoteDrawText(text)}:x=${x}:y=${y}:fontsize=${Math.round(fontSize)}:fontcolor=white[${to}]`;
}


interface RenderInputs {
  aIdle: MediaFile;
  aSpeaking: MediaFile; // generated circle PNG
  bIdle: MediaFile;
  bSpeaking: MediaFile; // generated circle PNG
  audioA?: MediaFile;
  audioB?: MediaFile;
  ring?: MediaFile;
  connected?: MediaFile;
  ended?: MediaFile;
}
