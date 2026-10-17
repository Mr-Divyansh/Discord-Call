import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'callframe-ffmpeg-core',
      configureServer(server) {
        const coreDir = path.resolve('public/ffmpeg-core');
        if (fs.existsSync(coreDir)) {
          server.middlewares.use('/ffmpeg-core', (req, res, next) => {
            const file = path.join(coreDir, decodeURIComponent(req.url!.slice('/ffmpeg-core'.length)));
            try {
              if (fs.existsSync(file)) {
                res.setHeader('Content-Type', file.endsWith('.wasm') ? 'application/wasm' : 'application/javascript');
                res.end(fs.readFileSync(file));
              } else {
                res.statusCode = 404;
                res.end('not found');
              }
            } catch {
              next();
            }
          });
        }
      },
    },
  ],
  root: path.resolve(__dirname),
  publicDir: 'public',
  build: {
    outDir: path.resolve('dist'),
    emptyOutDir: true,
  },
});
