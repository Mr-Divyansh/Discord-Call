import type { Project, ParticipantId, CallEffect, ExportSettings } from '../types';

export const PROJECT_VERSION = 1;

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  width: 1280,
  height: 720,
  fps: 30,
  crf: 23,
  audioBitrate: '192k',
};

export function emptyParticipant(id: ParticipantId): Participant {
  return {
    id,
    displayName: id === 'a' ? 'Divyansh' : 'Abhay',
    avatar: null,
    audio: null,
    volume: 1.0,
    offset: 0,
    sensitivity: 0.5,
    minSpeakingSec: 0.3,
  };
}

export function defaultProject(name = 'Untitled CallFrame Project'): Project {
  return {
    version: PROJECT_VERSION,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ringDuration: 4,
    connectedDuration: 2,
    participants: { a: emptyParticipant('a'), b: emptyParticipant('b') },
    effects: [],
    exportSettings: { ...DEFAULT_EXPORT_SETTINGS },
  };
}

export function validateProject(project: Project): string[] {
  const errors: string[] = [];
  if (!project.name.trim()) errors.push('Project name is required.');
  const { a, b } = project.participants;
  if (!a.audio) errors.push('Person A audio track is required.');
  if (!b.audio) errors.push('Person B audio track is required.');
  if (!a.audio?.duration || !b.audio?.duration) {
    errors.push('Audio tracks must be decoded before rendering.');
  }
  if (!a.avatar) errors.push("Person A's profile picture is required.");
  if (!b.avatar) errors.push("Person B's profile picture is required.");
  const { width, height, fps } = project.exportSettings;
  if (!width || !height || !fps) errors.push('Invalid export resolution or frame rate.');
  return errors;
}

export function timelineEvents(project: Project) {
  const { ringDuration, connectedDuration } = project;
  const ringStart = 0;
  const connectedStart = ringDuration;
  const conversationStart = connectedStart + connectedDuration;
  const a = project.participants.a;
  const b = project.participants.b;
  const aEnd = (a.audio?.duration ?? 0) + a.offset;
  const bEnd = (b.audio?.duration ?? 0) + b.offset;
  const conversationEnd = conversationStart + Math.max(aEnd, bEnd);
  const endedStart = conversationEnd;
  const duration = endedStart + 2; // tail after the ended sound

  return {
    ringStart,
    ringEnd: connectedStart,
    connectedStart,
    connectedEnd: conversationStart,
    conversationStart,
    conversationEnd,
    endedStart,
    endedEnd: duration,
    duration,
  };
}

export function serializeProject(project: Project): string {
  return JSON.stringify(project, null, 2);
}

export function deserializeProject(json: string): Project {
  const raw = JSON.parse(json) as Partial<Project>;
  const project = defaultProject(raw.name);
  project.version = raw.version ?? project.version;
  if (typeof raw.ringDuration === 'number') project.ringDuration = raw.ringDuration;
  if (typeof raw.connectedDuration === 'number') project.connectedDuration = raw.connectedDuration;
  if (raw.exportSettings) project.exportSettings = { ...DEFAULT_EXPORT_SETTINGS, ...raw.exportSettings };
  for (const id of ['a', 'b'] as ParticipantId[]) {
    const src = raw.participants?.[id];
    if (src) {
      project.participants[id] = {
        ...emptyParticipant(id),
        displayName: src.displayName ?? project.participants[id].displayName,
        avatar: src.avatar ?? null,
        audio: src.audio ?? null,
        volume: typeof src.volume === 'number' ? src.volume : 1,
        offset: typeof src.offset === 'number' ? src.offset : 0,
        sensitivity: typeof src.sensitivity === 'number' ? src.sensitivity : 0.5,
        minSpeakingSec: typeof src.minSpeakingSec === 'number' ? src.minSpeakingSec : 0.3,
      };
    }
  }
  if (Array.isArray(raw.effects)) {
    project.effects = raw.effects.map((e: Partial<CallEffect> & { id?: string }) => ({
      id: e.id || crypto.randomUUID(),
      type: e.type,
      file: e.file ?? null,
      startTime: typeof e.startTime === 'number' ? e.startTime : 0,
      volume: typeof e.volume === 'number' ? e.volume : 1,
    }));
  }
  project.updatedAt = Date.now();
  return project;
}

export function mediaFileFromFile(file: File): Promise<MediaFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        dataUrl: reader.result as string,
        duration: undefined,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
