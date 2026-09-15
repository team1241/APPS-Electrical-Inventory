import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

const meta = {
  title: 'UI/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
} satisfies Meta<typeof Collapsible>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Collapsible defaultOpen className="w-[350px] space-y-2">
      <CollapsibleTrigger render={<Button variant="outline" className="w-full" />}>
        Toggle content
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-3xl border px-4 py-3 text-sm">
        This content can be shown or hidden.
      </CollapsibleContent>
    </Collapsible>
  ),
}
