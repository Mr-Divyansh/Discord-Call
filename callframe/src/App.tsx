import { useState, useEffect, useRef, useCallback } from 'react';
import type { Project, ParticipantId, MediaFile, SpeakingInterval, CallStateInfo } from './types';
import {
  defaultProject,
  validateProject,
  mediaFileFromFile,
  timelineEvents,
  serializeProject,
  deserializeProject,
} from './lib/project';
import { decodeAudio, analyzeSpeaking, isSpeakingAt } from './lib/audio';
import { PreviewEngine } from './lib/preview';
import { RenderController, RenderInputs, loadImage, renderAvatarCircle } from './lib/render';
import { Header } from './components/Header';
import { ParticipantCard } from './components/ParticipantCard';
import { CallCanvas } from './components/CallCanvas';
import { Timeline } from './components/Timeline';

export default function App() {
  const [project, setProject] = useState<Project>(defaultProject('D Web Studio vs Abhay'));
  const [media, setMedia] = useState<Map<string, { arrayBuffer: ArrayBuffer; buffer: AudioBuffer; intervals: SpeakingInterval[] }>>(new Map());
  const [images, setImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [previewTime, setPreviewTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speakingA, setSpeakingA] = useState(false);
  const [speakingB, setSpeakingB] = useState(false);
  const [callState, setCallState] = useState<CallStateInfo>({ state: 'ringing', label: 'Ringing…' });
  const [renderProgress, setRenderProgress] = useState<{ stage: string; progress: number; message: string } | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderDone, setRenderDone] = useState<{ url: string; size: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const previewRef = useRef<PreviewEngine | null>(null);
  const renderRef = useRef<RenderController | null>(null);
  const rafRef = useRef<number | null>(null);

  const ev = timelineEvents(project);
  const a = project.participants.a;
  const b = project.participants.b;

  useEffect(() => {
    setPreviewDuration(ev.duration);
  }, [ev.duration]);

  useEffect(() => {
    if (!isPlaying) {
      setCallState({ state: 'ringing', label: 'Ringing…' });
      return;
    }
    const t = previewTime;
    if (t < ev.ringEnd) setCallState({ state: 'ringing', label: 'Ringing…' });
    else if (t < ev.conversationStart) setCallState({ state: 'connected', label: 'Connected' });
    else if (t < ev.conversationEnd) setCallState({ state: 'connected', label: 'Connected' });
    else setCallState({ state: 'ended', label: 'Call ended' });
  }, [previewTime, isPlaying, ev]);

  useEffect(() => {
    if (!isPlaying) { setSpeakingA(false); setSpeakingB(false); return; }
    const aMeta = media.get(a.audio?.id ?? '');
    const bMeta = media.get(b.audio?.id ?? '');
    const trackStartA = ev.conversationStart + a.offset;
    const trackStartB = ev.conversationStart + b.offset;
    const spkA = aMeta ? isSpeakingAt(aMeta.intervals, trackStartA, previewTime) : false;
    const spkB = bMeta ? isSpeakingAt(bMeta.intervals, trackStartB, previewTime) : false;
    setSpeakingA(spkA);
    setSpeakingB(spkB);
  }, [previewTime, isPlaying, media, a.audio?.id, b.audio?.id, ev, a.offset, b.offset]);

  useEffect(() => {
    if (!previewRef.current) return;
    const engine = previewRef.current;
    let lastT = engine.currentTime;
    const tick = () => {
      const t = engine.currentTime;
      if (t !== lastT) {
        lastT = t;
        setPreviewTime(Math.max(0, t));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying]);
  // Helpers ---------------------------------------------------------------

  const setParticipant = useCallback((id: ParticipantId, patch: Partial<import('./types').Participant>) => {
    setProject((p) => ({
      ...p,
      participants: { ...p.participants, [id]: { ...p.participants[id], ...patch } },
      updatedAt: Date.now(),
    }));
  }, []);

  const loadAvatar = useCallback(async (id: ParticipantId, file: File) => {
    const mf = await mediaFileFromFile(file);
    setParticipant(id, { avatar: mf });
    const img = await loadImage(mf.dataUrl);
    setImages((m) => new Map(m).set(mf.id, img));
  }, [setParticipant]);

  const loadAudio = useCallback(async (id: ParticipantId, file: File) => {
    const mf = await mediaFileFromFile(file);
    const ab = await fetch(mf.dataUrl).then((r) => r.arrayBuffer());
    const buffer = await decodeAudio(ab);
    const intervals = analyzeSpeaking(buffer, {
      sensitivity: id === 'a' ? a.sensitivity : b.sensitivity,
      minSpeakingSec: id === 'a' ? a.minSpeakingSec : b.minSpeakingSec,
      minGapSec: 0.2,
    });
    setParticipant(id, { audio: { ...mf, duration: buffer.duration } });
    setMedia((m) => new Map(m).set(mf.id, { arrayBuffer: ab, buffer, intervals }));
  }, [setParticipant, setMedia, a.sensitivity, b.sensitivity, a.minSpeakingSec, b.minSpeakingSec]);

  // Preview controls -------------------------------------------------------

  const handlePlayPause = useCallback(async () => {
    if (!previewRef.current) previewRef.current = new PreviewEngine();
    const engine = previewRef.current;

    if (isPlaying) {
      engine.stop();
      setIsPlaying(false);
      return;
    }

    const decodePromises: Promise<void>[] = [];
    const ensure = (id: ParticipantId, file: MediaFile | null) => {
      if (!file || media.has(file.id)) return;
      decodePromises.push(
        fetch(file.dataUrl)
          .then((r) => r.arrayBuffer())
          .then(async (ab) => {
            const buffer = await decodeAudio(ab);
            const intervals = analyzeSpeaking(buffer, {
              sensitivity: id === 'a' ? a.sensitivity : b.sensitivity,
              minSpeakingSec: id === 'a' ? a.minSpeakingSec : b.minSpeakingSec,
              minGapSec: 0.2,
            });
            setMedia((m) => new Map(m).set(file.id, { arrayBuffer: ab, buffer, intervals }));
            setParticipant(id, { audio: { ...file, duration: buffer.duration } });
          })
      );
    };
    ensure('a', a.audio);
    ensure('b', b.audio);
    await Promise.all(decodePromises);

    const ringEffect = project.effects.find((e) => e.type === 'outgoing-ring');
    const connectedEffect = project.effects.find((e) => e.type === 'connected');

    const ringBuffer = media.get(ringEffect?.file?.id ?? '')?.buffer ?? null;
    const connectedBuffer = media.get(connectedEffect?.file?.id ?? '')?.buffer ?? null;

    await engine.play(project, ringBuffer, connectedBuffer, (t) => {
      setPreviewTime(t);
      if (t >= ev.duration) {
        engine.stop();
        setIsPlaying(false);
      }
    });
    setIsPlaying(true);
  }, [isPlaying, project, media, a.audio, b.audio, setMedia, setParticipant, a.sensitivity, b.sensitivity, a.minSpeakingSec, b.minSpeakingSec, ev]);

  const handleSeek = useCallback((t: number) => {
    setPreviewTime(Math.max(0, Math.min(t, previewDuration)));
    if (previewRef.current && isPlaying) {
      previewRef.current.seek(t, project,
        media.get(project.effects.find((e) => e.type === 'outgoing-ring')?.file?.id ?? '')?.buffer ?? null,
        media.get(project.effects.find((e) => e.type === 'connected')?.file?.id ?? '')?.buffer ?? null
      );
    }
  }, [project, media, previewDuration, isPlaying]);

  const handlePreviewAsset = useCallback((buffer: AudioBuffer | null, volume: number) => {
    if (!previewRef.current) previewRef.current = new PreviewEngine();
    previewRef.current.playSolo(buffer, volume);
  }, []);

  // Save / load project -----------------------------------------------------

  const handleSaveProject = useCallback(() => {
    setSaving(true);
    const json = serializeProject(project);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${project.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setSaving(false);
  }, [project, setSaving]);

  const handleLoadProject = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const p = deserializeProject(reader.result as string);
        setProject(p);
        setMedia(new Map());
        setImages(new Map());
      } catch (err) {
        alert('Failed to load project file.');
      }
    };
    reader.readAsText(file);
  }, [setProject]);

  const handleNewProject = useCallback(() => {
    setProject(defaultProject('New CallFrame Project'));
    setMedia(new Map());
    setImages(new Map());
    setRenderDone(null);
    setRenderError(null);
  }, []);

  // Rendering ---------------------------------------------------------------

  const handleStartRender = async () => {
    const errors = validateProject(project);
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    setRenderError(null);
    setRenderDone(null);
    setRenderProgress({ stage: 'loading', progress: 0, message: 'Preparing render…' });

    const ringEffect = project.effects.find((e) => e.type === 'outgoing-ring');
    const connectedEffect = project.effects.find((e) => e.type === 'connected');
    const endedEffect = project.effects.find((e) => e.type === 'ended');

    const aImg = a.avatar ? await loadImage(a.avatar.dataUrl) : null;
    const bImg = b.avatar ? await loadImage(b.avatar.dataUrl) : null;
    const aIdlePng = await renderAvatarCircle(aImg, false, 1024);
    const aSpeakPng = await renderAvatarCircle(aImg, true, 1024);
    const bIdlePng = await renderAvatarCircle(bImg, false, 1024);
    const bSpeakPng = await renderAvatarCircle(bImg, true, 1024);

    const inputs: RenderInputs = {
      aIdle: { id: 'a-idle', name: 'a-idle.png', dataUrl: aIdlePng },
      aSpeaking: { id: 'a-speaking', name: 'a-speaking.png', dataUrl: aSpeakPng },
      bIdle: { id: 'b-idle', name: 'b-idle.png', dataUrl: bIdlePng },
      bSpeaking: { id: 'b-speaking', name: 'b-speaking.png', dataUrl: bSpeakPng },
      audioA: a.audio ?? undefined,
      audioB: b.audio ?? undefined,
      ring: ringEffect?.file ?? undefined,
      connected: connectedEffect?.file ?? undefined,
      ended: endedEffect?.file ?? undefined,
    };

    if (!renderRef.current) renderRef.current = new RenderController();
    try {
      await renderRef.current.startRender(project, inputs, (event) => {
        if (event.type === 'error') {
          setRenderError(event.payload instanceof Error ? event.payload.message : String(event.payload));
          setRenderProgress(null);
        } else if (event.type === 'progress') {
          setRenderProgress(event.payload);
        } else if (event.type === 'done') {
          setRenderDone(event.payload);
          setRenderProgress(null);
        } else if (event.type === 'log') {
          console.log('[ffmpeg]', event.payload);
        }
      });
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : String(err));
      setRenderProgress(null);
    }
  };

  const handleCancelRender = useCallback(() => {
    renderRef.current?.cancel();
    setRenderProgress(null);
    setRenderError(null);
  }, []);

  // JSX ---------------------------------------------------------------------

  return (
    <div className="app-shell">
      <Header
        project={project}
        onRename={(name) => setProject({ ...project, name, updatedAt: Date.now() })}
        onNewProject={handleNewProject}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onStartRender={handleStartRender}
        saving={saving}
      />

      <div className="workspace">
        <aside className="panel participants-panel">
          <ParticipantCard
            id="a"
            participant={a}
            media={media}
            images={images}
            onChange={(patch) => setParticipant('a', patch)}
            onSetAvatar={(f) => loadAvatar('a', f)}
            onSetAudio={(f) => loadAudio('a', f)}
            onPreviewAsset={handlePreviewAsset}
          />
          <ParticipantCard
            id="b"
            participant={b}
            media={media}
            images={images}
            onChange={(patch) => setParticipant('b', patch)}
            onSetAvatar={(f) => loadAvatar('b', f)}
            onSetAudio={(f) => loadAudio('b', f)}
            onPreviewAsset={handlePreviewAsset}
          />
        </aside>

        <section className="center-col">
          <CallCanvas
            project={project}
            images={images}
            speakingA={speakingA}
            speakingB={speakingB}
            callState={callState}
            time={previewTime}
            duration={previewDuration}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onSeekScrub={(t) => setPreviewTime(t)}
          />
          <Timeline
            project={project}
            intervals={new Map(
              Array.from(media.entries()).map(([id, m]) => [id, m.intervals])
            )}
            time={previewTime}
            duration={previewDuration}
            onSeek={handleSeek}
          />
        </section>

        <aside className="panel render-panel">
          <h2>Render</h2>
          <dl className="meta-list">
            <div><dt>Resolution</dt><dd>{project.exportSettings.width} × {project.exportSettings.height}</dd></div>
            <div><dt>FPS</dt><dd>{project.exportSettings.fps}</dd></div>
            <div><dt>CRF</dt><dd>{project.exportSettings.crf}</dd></div>
            <div><dt>Duration</dt><dd>{ev.duration.toFixed(1)}s</dd></div>
          </dl>

          {renderProgress && (
            <div className="render-progress">
              <p>{renderProgress.message}</p>
              <div className="progress-bar"><div style={{ width: `${Math.round(renderProgress.progress * 100)}%` }} /></div>
            </div>
          )}

          {renderError && (
            <div className="render-error">
              <p>Render failed</p>
              <pre>{renderError}</pre>
            </div>
          )}

          {renderDone && (
            <div className="render-done">
              <p>Render complete — {(renderDone.size / 1024 / 1024).toFixed(1)} MB</p>
              <a href={renderDone.url} download={`${project.name.replace(/\s+/g, '_')}.mp4`} className="btn btn-success">Download MP4</a>
            </div>
          )}

          {renderProgress ? (
            <button className="btn btn-danger" onClick={handleCancelRender}>Cancel Render</button>
          ) : (
            <button className="btn btn-primary" onClick={handleStartRender}>Render MP4</button>
          )}
        </aside>
      </div>
    </div>
  );
}

