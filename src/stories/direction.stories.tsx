import type { Meta, StoryObj } from '@storybook/react-vite'

import { DirectionProvider } from '@/components/ui/direction'

const meta = {
  title: 'UI/Direction',
  component: DirectionProvider,
  tags: ['autodocs'],
} satisfies Meta<typeof DirectionProvider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <DirectionProvider direction="rtl">
      <div className="space-y-2 text-sm">
        <p>שלום, זהו טקסט בעברית עם כיוון RTL.</p>
        <p>Hello, this text is displayed right-to-left.</p>
      </div>
    </DirectionProvider>
  ),
}
