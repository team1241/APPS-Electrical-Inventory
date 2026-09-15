import type { Meta, StoryObj } from '@storybook/react-vite'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import {
  Message,
  MessageAvatar,
  MessageContent,
} from '@/components/ui/message'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller'

const messages = [
  'Hello! How can I help you today?',
  'I can answer questions, help with tasks, or just chat.',
  'Try scrolling up to see earlier messages.',
  'The scroll-to-bottom button appears when you scroll away.',
  'This is the latest message in the conversation.',
]

const meta = {
  title: 'UI/MessageScroller',
  component: MessageScroller,
  tags: ['autodocs'],
} satisfies Meta<typeof MessageScroller>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <MessageScrollerProvider className="h-80 w-full max-w-md rounded-3xl border">
      <MessageScroller>
        <MessageScrollerViewport>
          <MessageScrollerContent>
            {messages.map((text, index) => (
              <MessageScrollerItem key={text} scrollAnchor={index === messages.length - 1}>
                <Message>
                  <MessageAvatar>
                    <Avatar className="size-8">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  </MessageAvatar>
                  <MessageContent>
                    <Bubble>
                      <BubbleContent>{text}</BubbleContent>
                    </Bubble>
                  </MessageContent>
                </Message>
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton direction="end" />
      </MessageScroller>
    </MessageScrollerProvider>
  ),
}
