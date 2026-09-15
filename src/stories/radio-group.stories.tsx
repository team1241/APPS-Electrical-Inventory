import type { Meta, StoryObj } from '@storybook/react-vite'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const meta = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="comfortable" className="max-w-sm">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="default" id="default" />
        <Label htmlFor="default">Default</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="comfortable" id="comfortable" />
        <Label htmlFor="comfortable">Comfortable</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="compact" id="compact" />
        <Label htmlFor="compact">Compact</Label>
      </div>
    </RadioGroup>
  ),
}
