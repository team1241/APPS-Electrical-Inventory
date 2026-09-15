import type { Meta, StoryObj } from '@storybook/react-vite'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageGroup,
} from '@/components/ui/message'

const aligns = ['start', 'end'] as const

const meta = {
  title: 'UI/Message',
  component: Message,
  tags: ['autodocs'],
  argTypes: {
    align: {
      control: 'select',
      options: aligns,
    },
  },
  args: {
    align: 'start',
  },
} satisfies Meta<typeof Message>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <MessageGroup className="max-w-md">
      <Message {...args}>
        <MessageAvatar>
          <Avatar className="size-8">
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble>
            <BubbleContent>Hello! How can I help you today?</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageGroup>
  ),
}

export const Conversation: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <MessageGroup className="max-w-md">
      <Message align="start">
        <MessageAvatar>
          <Avatar className="size-8">
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble>
            <BubbleContent>Hello! How can I help you today?</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageContent>
          <Bubble variant="secondary">
            <BubbleContent>Show me the weather forecast.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageGroup>
  ),
}
