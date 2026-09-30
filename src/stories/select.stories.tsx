import type { Meta, StoryObj } from '@storybook/react-vite'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const sizes = ['default', 'sm'] as const

const meta = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: sizes,
      description: 'SelectTrigger size',
    },
  },
  args: {
    size: 'default',
  },
} satisfies Meta<typeof Select> & { args: { size: (typeof sizes)[number] } }

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: ({ size }) => (
    <Select defaultValue="apple">
      <SelectTrigger className="w-[180px]" size={size}>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      {sizes.map((size) => (
        <Select key={size} defaultValue="apple">
          <SelectTrigger className="w-[180px]" size={size}>
            <SelectValue placeholder={size} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
          </SelectContent>
        </Select>
      ))}
    </div>
  ),
}
