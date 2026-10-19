import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolve(process.cwd(), '../backend'), 'VITE_')

  return {
    plugins: [react()],
    server: {
      port: Number(env.VITE_PORT || 7299),
      proxy: {
        "/api": {
          target: "http://127.0.0.1:3001",
          changeOrigin: true,
        },
      },
    },
  }
})