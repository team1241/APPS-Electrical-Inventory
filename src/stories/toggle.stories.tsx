import type { Meta, StoryObj } from '@storybook/react-vite'
import { BoldIcon } from 'lucide-react'

import { Toggle } from '@/components/ui/toggle'

const variants = ['default', 'outline'] as const
const sizes = ['default', 'sm', 'lg'] as const

const meta = {
  title: 'UI/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: variants,
    },
    size: {
      control: 'select',
      options: sizes,
    },
    disabled: {
      control: 'boolean',
    },
  },
  args: {
    variant: 'default',
    size: 'default',
    disabled: false,
    'aria-label': 'Toggle bold',
    children: <BoldIcon />,
  },
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {variants.map((variant) => (
        <Toggle key={variant} variant={variant} aria-label={variant}>
          <BoldIcon />
        </Toggle>
      ))}
    </div>
  ),
}

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {sizes.map((size) => (
        <Toggle key={size} size={size} aria-label={size}>
          <BoldIcon />
        </Toggle>
      ))}
    </div>
  ),
}
