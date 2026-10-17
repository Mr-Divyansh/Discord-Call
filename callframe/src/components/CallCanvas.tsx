import type { Project, CallStateInfo, MediaFile } from '../types';

interface CallCanvasProps {
  project: Project;
  images: Map<string, HTMLImageElement>;
  speakingA: boolean;
  speakingB: boolean;
  callState: CallStateInfo;
  time: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (t: number) => void;
  onSeekScrub: (t: number) => void;
}

function fmtTime(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function CallCanvas({ project, images, speakingA, speakingB, callState, time, duration, isPlaying, onPlayPause, onSeek, onSeekScrub }: CallCanvasProps) {
  const { a, b } = project.participants;
  const aImg = a.avatar ? images.get(a.avatar.id) ?? undefined : undefined;
  const bImg = b.avatar ? images.get(b.avatar.id) ?? undefined : undefined;

  return (
    <div className="canvas-wrap">
      <div className="call-scene" role="region" aria-label="Call preview">
        <span className={`state-badge ${callState.state}`} aria-live="polite">
          {callState.label}
        </span>
        <div className="avatars">
          <div className="avatar-cell">
            <div className={`avatar-wrap ${speakingA ? 'speaking' : ''}`} aria-label={`Person A ${a.displayName}`}>
              {aImg ? <img src={aImg.src} alt="" /> : <span style={{ fontSize: 72, color: '#4b4f56' }} aria-hidden="true">&#9785;</span>}
            </div>
            <div className="avatar-name" title={a.displayName}>{a.displayName}</div>
          </div>
          <div className="avatar-cell">
            <div className={`avatar-wrap ${speakingB ? 'speaking' : ''}`} aria-label={`Person B ${b.displayName}`}>
              {bImg ? <img src={bImg.src} alt="" /> : <span style={{ fontSize: 72, color: '#4b4f56' }} aria-hidden="true">&#9785;</span>}
            </div>
            <div className="avatar-name" title={b.displayName}>{b.displayName}</div>
          </div>
        </div>
        {!a.audio || !b.audio ? (
          <div className="call-hint">Upload both participant audio tracks to preview the full call sequence.</div>
        ) : null}
      </div>
      <div className="playback-bar">
        <button className="btn" onClick={onPlayPause} aria-label={isPlaying ? 'Pause preview' : 'Play preview'}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <div className="seek-row">
          <input
            type="range"
            min="0"
            max={Math.max(duration, 1)}
            step="0.1"
            value={time}
            onChange={(e) => onSeekScrub(parseFloat(e.target.value))}
            onMouseUp={(e) => onSeek(parseFloat(e.target.value))}
            onTouchEnd={(e) => onSeek(parseFloat((e.target as HTMLInputElement).value))}
            aria-label="Seek"
          />
          <div className="time">{fmtTime(time)} / {fmtTime(duration)}</div>
        </div>
        {!a.audio || !b.audio || !project.effects.find((e) => e.type === 'outgoing-ring')?.file
          ? <span className="warn" style={{ fontSize: 12 }}>Add audio + ringtone to hear the preview.</span>
          : null}
      </div>
    </div>
  );
}
