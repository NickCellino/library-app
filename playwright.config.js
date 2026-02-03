import { defineConfig, devices } from '@playwright/test'
import path from 'path'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Chrome only supports one fake video file globally
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on'
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            `--use-file-for-fake-video-capture=${path.resolve('tests/fixtures/barcode-scan-test.mjpeg')}`,
          ],
        },
      },
    },
  ],

  webServer: [
    {
      command: 'npm run emulators',
      url: 'http://localhost:9099',  // Wait for auth emulator REST API
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
    {
      command: 'VITE_USE_EMULATOR=true npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],
})
