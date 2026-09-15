import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-themes",
    "@storybook/addon-mcp"
  ],
  "framework": "@storybook/react-vite",
  "staticDirs": [{ from: './public', to: '/' }],
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@': path.resolve(dirname, '../src'),
        },
      },
      // Pre-bundle deps used across stories so Vite doesn't rediscover them
      // mid-session and force a full reload ("optimized dependencies changed").
      optimizeDeps: {
        include: [
          'react',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-dom',
          'react-dom/client',
          'storybook/theming',
          'class-variance-authority',
          'clsx',
          'tailwind-merge',
          'lucide-react',
          'cmdk',
          'date-fns',
          'embla-carousel-react',
          'input-otp',
          'react-day-picker',
          'react-resizable-panels',
          'recharts',
          '@base-ui/react',
          '@base-ui/react/accordion',
          '@base-ui/react/alert-dialog',
          '@base-ui/react/avatar',
          '@base-ui/react/button',
          '@base-ui/react/checkbox',
          '@base-ui/react/collapsible',
          '@base-ui/react/context-menu',
          '@base-ui/react/dialog',
          '@base-ui/react/direction-provider',
          '@base-ui/react/drawer',
          '@base-ui/react/input',
          '@base-ui/react/menu',
          '@base-ui/react/menubar',
          '@base-ui/react/merge-props',
          '@base-ui/react/navigation-menu',
          '@base-ui/react/popover',
          '@base-ui/react/preview-card',
          '@base-ui/react/progress',
          '@base-ui/react/radio',
          '@base-ui/react/radio-group',
          '@base-ui/react/scroll-area',
          '@base-ui/react/select',
          '@base-ui/react/separator',
          '@base-ui/react/slider',
          '@base-ui/react/switch',
          '@base-ui/react/tabs',
          '@base-ui/react/toast',
          '@base-ui/react/toggle',
          '@base-ui/react/toggle-group',
          '@base-ui/react/tooltip',
          '@base-ui/react/use-render',
          '@shadcn/react/message-scroller',
          '@storybook/addon-themes'
        ],
      },
    });
  },
};
export default config;