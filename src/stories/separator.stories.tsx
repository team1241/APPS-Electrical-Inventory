import type { Meta, StoryObj } from '@storybook/react-vite'

import { Separator } from '@/components/ui/separator'

const orientations = ['horizontal', 'vertical'] as const

const meta = {
  title: 'UI/Separator',
  component: Separator,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: orientations,
    },
  },
  args: {
    orientation: 'horizontal',
  },
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) =>
    args.orientation === 'vertical' ? (
      <div className="flex h-16 items-center gap-4">
        <div className="text-sm font-medium">Left</div>
        <Separator {...args} />
        <div className="text-sm text-muted-foreground">Right</div>
      </div>
    ) : (
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium">Section</div>
        <Separator {...args} />
        <div className="text-sm text-muted-foreground">
          Content below the separator.
        </div>
      </div>
    ),
}

export const Orientations: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium">Horizontal</div>
        <Separator orientation="horizontal" />
        <div className="text-sm text-muted-foreground">Below</div>
      </div>
      <div className="flex h-16 items-center gap-4">
        <div className="text-sm font-medium">Left</div>
        <Separator orientation="vertical" />
        <div className="text-sm text-muted-foreground">Right</div>
      </div>
    </div>
  ),
}
