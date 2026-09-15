import type { Meta, StoryObj } from '@storybook/react-vite'

import { AspectRatio } from '@/components/ui/aspect-ratio'

const meta = {
  title: 'UI/AspectRatio',
  component: AspectRatio,
  tags: ['autodocs'],
} satisfies Meta<typeof AspectRatio>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    ratio: 16 / 9,
  },
  render: (args) => (
    <div className="w-[450px]">
      <AspectRatio {...args} className="overflow-hidden rounded-2xl bg-muted">
        <img
          src="https://picsum.photos/800/450"
          alt="Sample"
          className="size-full object-cover"
        />
      </AspectRatio>
    </div>
  ),
}
