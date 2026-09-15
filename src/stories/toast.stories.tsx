import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '@/components/ui/button'
import { toast, Toaster } from '@/components/ui/toast'

const meta = {
  title: 'UI/Toast',
  component: Toaster,
  tags: ['autodocs'],
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <>
      <Toaster />
      <Button
        onClick={() =>
          toast.add({
            title: 'Event created',
            description: 'Your event has been scheduled.',
          })
        }
      >
        Show toast
      </Button>
    </>
  ),
}
