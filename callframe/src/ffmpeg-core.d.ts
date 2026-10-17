declare module '@ffmpeg/core' {
  const createFFmpegCore: (wasmBinary?: Uint8Array) => Promise<any>;
  export default createFFmpegCore;
}
