/// <reference lib="webworker" />
import createFFmpegCore from '@ffmpeg/core';

type WorkerMessage =
  | { type: 'LOAD' }
  | { type: 'WRITE_FILE'; path: string; data: Uint8Array }
  | { type: 'READ_FILE'; path: string }
  | { type: 'EXEC'; args: string[] }
  | { type: 'TERMINATE' };


let ffmpeg: any = null;

async function loadCore() {
  if (ffmpeg) return;
  // Load the WASM bytes directly so nothing depends on a remote CDN.
  const res = await fetch('/ffmpeg-core/ffmpeg-core.wasm');
  if (!res.ok) throw new Error(`ffmpeg.wasm fetch failed: ${res.status}`);
  const wasmBytes = await res.arrayBuffer();
  ffmpeg = await createFFmpegCore(wasmBytes as unknown as Uint8Array);
  ffmpeg.setLogger((m: any) => self.postMessage({ type: 'LOG', data: m }));
  ffmpeg.setProgress((p: any) => self.postMessage({ type: 'PROGRESS', data: p }));
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type } = e.data;
  try {
    switch (type) {
      case 'LOAD':
        await loadCore();
        self.postMessage({ type: 'LOADED' });
        break;
      case 'WRITE_FILE':
        ffmpeg.FS.writeFile(e.data.path, e.data.data);
        self.postMessage({ type: 'OK' });
        break;
      case 'READ_FILE': {
        const data = ffmpeg.FS.readFile(e.data.path, { encoding: 'binary' });
        self.postMessage({ type: 'FILE_DATA', path: e.data.path, data }, [data.buffer]);
        break;
      }
      case 'EXEC': {
        // emscripten ffmpeg exec is variadic; exit code lands in ffmpeg.ret
        ffmpeg.exec(...e.data.args);
        self.postMessage({ type: 'EXEC_OK', data: ffmpeg.ret });
        break;
      }
      case 'TERMINATE':
        self.close();
        break;
      default:
        throw new Error(`unknown worker message: ${type}`);
    }
  } catch (err) {
    self.postMessage({ type: 'ERROR', data: err instanceof Error ? err.message : String(err) });
  }
};
