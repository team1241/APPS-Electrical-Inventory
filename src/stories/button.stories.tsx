import type { Meta, StoryObj } from '@storybook/react-vite'
import { MailIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

const variants = [
  'default',
  'outline',
  'secondary',
  'ghost',
  'destructive',
  'link',
] as const

const sizes = [
  'default',
  'xs',
  'sm',
  'lg',
  'icon',
  'icon-xs',
  'icon-sm',
  'icon-lg',
] as const

const meta = {
  title: 'UI/Button',
  component: Button,
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
    children: 'Button',
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <MailIcon data-icon="inline-start" />
        Send email
      </>
    ),
  },
}

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {variants.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
}

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {sizes
        .filter((size) => !size.startsWith('icon'))
        .map((size) => (
          <Button key={size} size={size}>
            {size}
          </Button>
        ))}
      {sizes
        .filter((size) => size.startsWith('icon'))
        .map((size) => (
          <Button key={size} size={size} aria-label={size}>
            <MailIcon />
          </Button>
        ))}
    </div>
  ),
}
