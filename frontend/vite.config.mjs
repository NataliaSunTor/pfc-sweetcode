import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// outDir 'build' para respetar el DockerFile existente (copia /app/build a nginx)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'build',
  },
});
