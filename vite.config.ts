/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import dts from 'vite-plugin-dts'
import path from 'node:path'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import pkg from './package.json' with { type: 'json' }

const dirname = import.meta.dirname

const external = [
  ...Object.keys(pkg.peerDependencies),
  ...Object.keys(pkg.dependencies),
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  /^@base-ui\/react(?:\/.*)?$/,
  /^@shadcn\/react(?:\/.*)?$/,
  /^recharts(?:\/.*)?$/,
  /^lucide-react(?:\/.*)?$/,
]

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({
      include: ['src/index.ts', 'src/components', 'src/hooks', 'src/lib'],
      exclude: ['src/**/*.stories.tsx', 'src/stories/**'],
      rollupTypes: true,
      tsconfigPath: path.resolve(dirname, 'tsconfig.app.json'),
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: {
        index: path.resolve(dirname, 'src/index.ts'),
        styles: path.resolve(dirname, 'src/styles.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
      cssFileName: 'components',
    },
    rollupOptions: {
      external,
      output: {
        assetFileNames: 'components[extname]',
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    emptyOutDir: true,
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
        },
      },
    ],
  },
})
