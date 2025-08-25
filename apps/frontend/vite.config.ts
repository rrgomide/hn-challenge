import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'

export default defineConfig(({ command, mode }) => {
  const isTest = mode === 'test'

  return {
    plugins: isTest ? [] : [reactRouter()],
    server: {
      port: 3030,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./app/test-setup.ts'],
    },
  }
})
