import type { Project, SpeakingInterval } from '../types';

interface TimelineProps {
  project: Project;
  intervals: Map<string, SpeakingInterval[]>;
  time: number;
  duration: number;
  onSeek: (t: number) => void;
}

const evTimes = (p: Project) => ({
  ringDuration: p.ringDuration,
  connectedDuration: p.connectedDuration,
  conversationStart: p.ringDuration + p.connectedDuration,
});

export function Timeline({ project, intervals, time, duration, onSeek }: TimelineProps) {
  const { a, b } = project.participants;
  const ev = evTimes(project);
  const scale = duration > 0 ? 100 / duration : 0;
  const px = (t: number) => `${Math.max(0, t) * scale}%`;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    onSeek(fraction * duration);
  };

  const row = (
    label: string,
    audioBar: JSX.Element | null,
    speakingSegs: JSX.Element[],
    effectSegs: JSX.Element[]
  ) => (
    <div className="tl-track-row" key={label}>
      <div className="tl-track-label">{label}</div>
      <div className="tl-track" onClick={handleClick}>
        {audioBar}
        {speakingSegs}
        {effectSegs}
      </div>
    </div>
  );

  const effectSegs = project.effects.map((ef, i) => {
    if (!ef.file) return null;
    const dur = ef.type === 'ended' ? (ef.file.duration ?? 2) : ef.type === 'connected' ? project.connectedDuration : project.ringDuration;
    return (
      <div key={`ef-${i}`} className="tl-segment effect" style={{ left: px(ef.startTime), width: px(dur) }} title={`${ef.type} at ${ef.startTime}s`} />
    );
  });

  return (
    <div className="timeline" onClick={handleClick}>
      <div className="tl-ruler">
        {Array.from({ length: Math.ceil(duration / 5) + 1 }, (_, i) => i * 5).map((t) => (
          <div key={`tick-${t}`} className="tl-tick" style={{ left: px(t) }} />
        ))}
      </div>
      <div className="tl-playhead" style={{ left: px(time) }} aria-label="playhead" />
      {row(
        `Person A · ${a.displayName}`,
        a.audio ? <div className="tl-segment audio" style={{ width: px((a.audio.duration ?? 0) + a.offset) }} /> : null,
        (intervals.get(a.audio?.id ?? '') ?? []).map((iv, i) => (
          <div key={`a-${i}`} className="tl-segment speaking" style={{ left: px(ev.conversationStart + a.offset + iv.start), width: px(iv.end - iv.start) }} />
        )),
        effectSegs
      )}
      {row(
        `Person B · ${b.displayName}`,
        b.audio ? <div className="tl-segment audio" style={{ width: px((b.audio.duration ?? 0) + b.offset) }} /> : null,
        (intervals.get(b.audio?.id ?? '') ?? []).map((iv, i) => (
          <div key={`b-${i}`} className="tl-segment speaking" style={{ left: px(ev.conversationStart + b.offset + iv.start), width: px(iv.end - iv.start) }} />
        )),
        []
      )}
    </div>
  );
}
