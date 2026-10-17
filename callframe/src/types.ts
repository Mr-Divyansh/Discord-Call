export type ParticipantId = 'a' | 'b';

export interface MediaFile {
  id: string;
  name: string;
  dataUrl: string;      // data URL of the uploaded file (embedded in project JSON)
  duration?: number;    // seconds, populated after decoding
}

export interface Participant {
  id: ParticipantId;
  displayName: string;
  avatar: MediaFile | null;
  audio: MediaFile | null;
  volume: number;       // 0 .. 2
  offset: number;       // seconds, shifts track start within the timeline
  sensitivity: number;  // 0 .. 1, voice-activity sensitivity
  minSpeakingSec: number;
}

export type EffectType = 'outgoing-ring' | 'connected' | 'ended';

export interface CallEffect {
  id: string;
  type: EffectType;
  file: MediaFile | null;
  startTime: number;    // seconds from project start
  volume: number;       // 0 .. 2
}

export interface SpeakingInterval { start: number; end: number; }

export interface ExportSettings {
  width: number;        // px
  height: number;       // px
  fps: number;
  crf: number;          // x264 quality, 18 .. 28
  audioBitrate: string; // e.g. '192k'
}

export interface Project {
  version: number;
  name: string;
  createdAt: number;
  updatedAt: number;
  ringDuration: number;      // seconds
  connectedDuration: number; // seconds
  participants: Record<ParticipantId, Participant>;
  effects: CallEffect[];
  exportSettings: ExportSettings;
}

export interface RenderProgressEvent {
  stage: 'loading' | 'analyzing' | 'encoding' | 'finished';
  progress: number; // 0 .. 1
  message: string;
}

export interface CallStateInfo {
  state: 'ringing' | 'connected' | 'ended';
  label: string;
}
