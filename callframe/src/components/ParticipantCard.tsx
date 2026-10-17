import { useState, useRef, useEffect, useCallback } from 'react';
import type { Project, ParticipantId, Participant, MediaFile } from '../types';
import { mediaFileFromFile } from '../lib/project';
import { decodeAudio, analyzeSpeaking } from '../lib/audio';
import { Upload, Play, Speaker, Trash2, RefreshCw } from 'lucide-react';

interface ParticipantCardProps {
  id: ParticipantId;
  participant: Participant;
  media: Map<string, { arrayBuffer: ArrayBuffer; buffer: AudioBuffer; intervals: { start: number; end: number }[] }>;
  images: Map<string, HTMLImageElement>;
  onChange: (patch: Partial<Participant>) => void;
  onSetAvatar: (file: File) => void;
  onSetAudio: (file: File) => void;
  onPreviewAsset: (buffer: AudioBuffer | null, volume: number) => void;
}

export function ParticipantCard({ id, participant, media, images, onChange, onSetAvatar, onSetAudio, onPreviewAsset }: ParticipantCardProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const audioInput = useRef<HTMLInputElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/image\/(png|jpeg|webp)/.test(file.type)) { alert('Please upload a PNG, JPG, or WebP image.'); return; }
    onSetAvatar(file);
    e.target.value = '';
  };

  const handleAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/audio\/(mp3|mpeg|wav|mp4|x-m4a|aac)/.test(file.type) && !file.name.match(/\.(mp3|wav|m4a|aac)$/i)) { alert('Please upload an MP3, WAV, or M4A audio file.'); return; }
    onSetAudio(file);
    e.target.value = '';
  };

  const handleDrop = (accept: string[], onFile: (f: File) => void) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && accept.some((a) => file.type.startsWith(a.split('/')[0]) || file.name.match(new RegExp(a.split('.')[1] ?? '')))) onFile(file);
  };

  const img = participant.avatar ? images.get(participant.avatar.id) : undefined;
  const meta = media.get(participant.audio?.id ?? '');
  const duration = meta?.buffer.duration ?? participant.audio?.duration ?? 0;

  return (
    <section style={{ border: '1px solid var(--panel-border)', borderRadius: 10, padding: 12, background: '#101216' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{id === 'a' ? 'Person A' : 'Person B'}</span>
        <span style={{ fontSize: 11, color: '#5865f2', background: 'rgba(88,101,242,0.12)', padding: '1px 6px', borderRadius: 4 }}>{id === 'a' ? 'Divyansh' : 'Abhay'}</span>
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Display name</label>
        <input
          value={participant.displayName}
          onChange={(e) => onChange({ displayName: e.target.value })}
        />
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Profile picture (PNG / JPG / WebP)</label>
        <div
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop(['image/'], onSetAvatar)}
          style={{ borderStyle: participant.avatar ? 'solid' : 'dashed', background: participant.avatar ? '#131916' : '#101216' }}
        >
          <input ref={avatarInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleAvatar} />
          {participant.avatar ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <img src={participant.avatar.dataUrl} alt="" className="asset-thumb" />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{participant.avatar.name}</span>
              <button className="btn btn-small" style={{ padding: '2px 8px' }} onClick={(e) => { e.stopPropagation(); onChange({ avatar: null }); }}>Remove</button>
            </div>
          ) : (
            <>
              <Upload size={16} style={{ color: 'var(--text-muted)' }} />
              <div style={{ fontSize: 13 }}>Drop or click to upload profile picture</div>
            </>
          )}
          <input style={{ display: 'none' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Audio track (MP3 / WAV / M4A)</label>
        <div
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop(['audio/'], onSetAudio)}
          style={{ borderStyle: participant.audio ? 'solid' : 'dashed', background: participant.audio ? '#131916' : '#101216' }}
        >
          <input ref={audioInput} type="file" accept="audio/mp3,audio/wav,audio/m4a,.mp3,.wav,.m4a,.aac" hidden onChange={handleAudio} />
          {participant.audio ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{participant.audio.name}</span>
              <span style={{ fontSize: 11, color: meta ? 'var(--green)' : '#c88a1a' }}>{meta ? '\u2713 decoded \u00b7 ' + duration.toFixed(1) + 's' : analyzing ? 'analyzing…' : 'pending'}</span>
              <div className="row" style={{ justifyContent: 'center' }}>
                <button className="btn btn-small" onClick={() => onPreviewAsset(meta?.buffer ?? null, participant.volume)} disabled={!meta} title="Preview this track only">{meta ? <Play size={14} /> : '…'}</button>
                <button className="btn btn-small" onClick={(e) => { e.stopPropagation(); onChange({ audio: null }); media.delete(participant.audio?.id ?? ''); }}>Remove</button>
              </div>
            </div>
          ) : (
            <>
              <Upload size={16} style={{ color: 'var(--text-muted)' }} />
              <div style={{ fontSize: 13 }}>Drop or click to upload audio</div>
            </>
          )}
        </div>
      </div>

      {meta && (
        <>
          <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Volume</label>
            <input type="range" min="0" max="2" step="0.05" value={participant.volume} onChange={(e) => onChange({ volume: parseFloat(e.target.value) })} />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Timeline offset (seconds)</label>
            <input value={participant.offset} onChange={(e) => onChange({ offset: parseFloat(e.target.value) || 0 })} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Shifts when this track starts within the call.</span>
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Speaking sensitivity</label>
            <input type="range" min="0" max="1" step="0.05" value={participant.sensitivity} onChange={(e) => onChange({ sensitivity: parseFloat(e.target.value) })} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Detects the green speaking ring from this track.</span>
          </div>
        </>
      )}
    </section>
  );
}
