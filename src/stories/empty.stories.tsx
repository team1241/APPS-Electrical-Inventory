import type { Meta, StoryObj } from '@storybook/react-vite'
import { InboxIcon } from 'lucide-react'

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

const mediaVariants = ['default', 'icon'] as const

const meta = {
  title: 'UI/Empty',
  component: Empty,
  tags: ['autodocs'],
  argTypes: {
    mediaVariant: {
      control: 'select',
      options: mediaVariants,
      description: 'EmptyMedia variant',
    },
  },
  args: {
    mediaVariant: 'icon',
  },
} satisfies Meta<typeof Empty> & {
  args: { mediaVariant: (typeof mediaVariants)[number] }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: ({ mediaVariant }) => (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant={mediaVariant}>
          <InboxIcon />
        </EmptyMedia>
        <EmptyTitle>No messages</EmptyTitle>
        <EmptyDescription>
          You don&apos;t have any messages yet. Start a conversation to see them
          here.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
}

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-full flex-col gap-4">
      {mediaVariants.map((mediaVariant) => (
        <Empty key={mediaVariant} className="border">
          <EmptyHeader>
            <EmptyMedia variant={mediaVariant}>
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>media: {mediaVariant}</EmptyTitle>
            <EmptyDescription>
              EmptyMedia variant preview.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ))}
    </div>
  ),
}
