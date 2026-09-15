import type { PropsWithChildren } from 'react'
import type { Preview } from '@storybook/react-vite'
import { withThemeByClassName } from '@storybook/addon-themes'
import {
  DocsContainer,
  type DocsContainerProps,
} from '@storybook/addon-docs/blocks'
import { themes } from 'storybook/theming'
import { TooltipProvider } from '@/components/ui/tooltip'
import '../src/styles/index.css'
import './preview.css'

function ThemedDocsContainer({
  children,
  context,
  ...props
}: PropsWithChildren<DocsContainerProps>) {
  const themeName =
    (
      context as {
        store?: { userGlobals?: { globals?: { theme?: string } } }
      }
    ).store?.userGlobals?.globals?.theme ?? 'light'

  return (
    <DocsContainer
      {...props}
      context={context}
      theme={themeName === 'dark' ? themes.dark : themes.light}
    >
      {children}
    </DocsContainer>
  )
}

const preview: Preview = {
  decorators: [
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
    (Story) => (
      <TooltipProvider>
        <div className="bg-background text-foreground p-4">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
  parameters: {
    docs: {
      container: ThemedDocsContainer,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
}

export default preview
