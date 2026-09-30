import type { Meta, StoryObj } from '@storybook/react-vite'

import { Bubble, BubbleContent, BubbleGroup } from '@/components/ui/bubble'

const variants = [
  'default',
  'secondary',
  'muted',
  'tinted',
  'outline',
  'ghost',
  'destructive',
] as const
const aligns = ['start', 'end'] as const

const meta = {
  title: 'UI/Bubble',
  component: Bubble,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: variants,
    },
    align: {
      control: 'select',
      options: aligns,
    },
  },
  args: {
    variant: 'default',
    align: 'start',
  },
} satisfies Meta<typeof Bubble>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <BubbleGroup className="max-w-md">
      <Bubble {...args}>
        <BubbleContent>Hey, how are you doing today?</BubbleContent>
      </Bubble>
    </BubbleGroup>
  ),
}

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <BubbleGroup className="max-w-md">
      {variants.map((variant) => (
        <Bubble key={variant} variant={variant}>
          <BubbleContent>{variant} bubble</BubbleContent>
        </Bubble>
      ))}
    </BubbleGroup>
  ),
}

export const Conversation: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <BubbleGroup className="max-w-md">
      <Bubble variant="muted">
        <BubbleContent>Hey, how are you doing today?</BubbleContent>
      </Bubble>
      <Bubble variant="default" align="end">
        <BubbleContent>I&apos;m doing great, thanks for asking!</BubbleContent>
      </Bubble>
    </BubbleGroup>
  ),
}
