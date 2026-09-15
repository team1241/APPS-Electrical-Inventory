import type { Meta, StoryObj } from '@storybook/react-vite'
import { BoldIcon, ItalicIcon, UnderlineIcon } from 'lucide-react'

import { ButtonGroup } from '@/components/ui/button-group'
import { Button } from '@/components/ui/button'

const orientations = ['horizontal', 'vertical'] as const

const meta = {
  title: 'UI/ButtonGroup',
  component: ButtonGroup,
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
} satisfies Meta<typeof ButtonGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outline" size="icon">
        <BoldIcon />
      </Button>
      <Button variant="outline" size="icon">
        <ItalicIcon />
      </Button>
      <Button variant="outline" size="icon">
        <UnderlineIcon />
      </Button>
    </ButtonGroup>
  ),
}

export const Orientations: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      {orientations.map((orientation) => (
        <ButtonGroup key={orientation} orientation={orientation}>
          <Button variant="outline" size="icon">
            <BoldIcon />
          </Button>
          <Button variant="outline" size="icon">
            <ItalicIcon />
          </Button>
          <Button variant="outline" size="icon">
            <UnderlineIcon />
          </Button>
        </ButtonGroup>
      ))}
    </div>
  ),
}
