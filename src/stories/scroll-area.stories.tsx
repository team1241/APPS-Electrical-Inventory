import type { Meta, StoryObj } from '@storybook/react-vite'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

const meta = {
  title: 'UI/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs'],
} satisfies Meta<typeof ScrollArea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-48 w-full max-w-sm rounded-3xl border">
      <div className="p-4">
        {Array.from({ length: 20 }, (_, index) => (
          <div key={index}>
            <div className="py-2 text-sm">Item {index + 1}</div>
            {index < 19 && <Separator />}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}
