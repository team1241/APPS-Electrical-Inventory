import type { Meta, StoryObj } from '@storybook/react-vite'
import { SearchIcon } from 'lucide-react'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'

const aligns = [
  'inline-start',
  'inline-end',
  'block-start',
  'block-end',
] as const

const meta = {
  title: 'UI/InputGroup',
  component: InputGroup,
  tags: ['autodocs'],
  argTypes: {
    align: {
      control: 'select',
      options: aligns,
      description: 'InputGroupAddon align',
    },
  },
  args: {
    align: 'inline-start',
  },
} satisfies Meta<typeof InputGroup> & {
  args: { align: (typeof aligns)[number] }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: ({ align }) => (
    <InputGroup className="w-[350px]">
      <InputGroupAddon align={align}>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search..." />
    </InputGroup>
  ),
}

export const Aligns: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-4">
      {aligns.map((align) => (
        <InputGroup key={align}>
          <InputGroupAddon align={align}>
            <SearchIcon />
            <span className="text-xs">{align}</span>
          </InputGroupAddon>
          <InputGroupInput placeholder="Search..." />
        </InputGroup>
      ))}
    </div>
  ),
}
