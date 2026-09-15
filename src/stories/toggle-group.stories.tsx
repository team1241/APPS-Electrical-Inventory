import type { Meta, StoryObj } from '@storybook/react-vite'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const variants = ['default', 'outline'] as const
const sizes = ['default', 'sm', 'lg'] as const
const orientations = ['horizontal', 'vertical'] as const

const meta = {
  title: 'UI/ToggleGroup',
  component: ToggleGroup,
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
    orientation: {
      control: 'select',
      options: orientations,
    },
  },
  args: {
    variant: 'default',
    size: 'default',
    orientation: 'horizontal',
    defaultValue: ['bold'],
  },
} satisfies Meta<typeof ToggleGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
      <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-4">
      {variants.map((variant) => (
        <ToggleGroup key={variant} variant={variant} defaultValue={['bold']}>
          <ToggleGroupItem value="bold">{variant}</ToggleGroupItem>
          <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
          <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
        </ToggleGroup>
      ))}
    </div>
  ),
}
