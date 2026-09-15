import type { Meta, StoryObj } from '@storybook/react-vite'

import { Switch } from '@/components/ui/switch'

const sizes = ['default', 'sm'] as const

const meta = {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: sizes,
    },
    disabled: {
      control: 'boolean',
    },
  },
  args: {
    size: 'default',
    disabled: false,
    id: 'airplane-mode',
  },
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Switch {...args} />
      <label htmlFor={args.id} className="text-sm">
        Airplane Mode
      </label>
    </div>
  ),
}

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-3">
      {sizes.map((size) => (
        <div key={size} className="flex items-center gap-2">
          <Switch id={`switch-${size}`} size={size} />
          <label htmlFor={`switch-${size}`} className="text-sm">
            {size}
          </label>
        </div>
      ))}
    </div>
  ),
}
