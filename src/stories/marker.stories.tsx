import type { Meta, StoryObj } from '@storybook/react-vite'
import { CalendarIcon } from 'lucide-react'

import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker'

const variants = ['default', 'separator', 'border'] as const

const meta = {
  title: 'UI/Marker',
  component: Marker,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: variants,
    },
  },
  args: {
    variant: 'separator',
  },
} satisfies Meta<typeof Marker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Marker {...args} className="max-w-md">
      <MarkerIcon>
        <CalendarIcon />
      </MarkerIcon>
      <MarkerContent>Today</MarkerContent>
    </Marker>
  ),
}

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-4">
      {variants.map((variant) => (
        <Marker key={variant} variant={variant}>
          <MarkerIcon>
            <CalendarIcon />
          </MarkerIcon>
          <MarkerContent>{variant}</MarkerContent>
        </Marker>
      ))}
    </div>
  ),
}
