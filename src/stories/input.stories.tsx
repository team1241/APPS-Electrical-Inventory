import type { Meta, StoryObj } from '@storybook/react-vite'

import { Input } from '@/components/ui/input'

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Input type="email" placeholder="Email" className="w-[350px]" />
  ),
}
