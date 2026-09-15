import type { Meta, StoryObj } from '@storybook/react-vite'

import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const orientations = ['vertical', 'horizontal', 'responsive'] as const

const meta = {
  title: 'UI/Field',
  component: Field,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: orientations,
    },
  },
  args: {
    orientation: 'vertical',
  },
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <FieldGroup className="w-[350px]">
      <Field {...args}>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input id="email" type="email" placeholder="Enter your email" />
      </Field>
    </FieldGroup>
  ),
}

export const Orientations: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-6">
      {orientations.map((orientation) => (
        <FieldGroup key={orientation}>
          <Field orientation={orientation}>
            <FieldLabel htmlFor={`email-${orientation}`}>
              {orientation}
            </FieldLabel>
            <Input
              id={`email-${orientation}`}
              type="email"
              placeholder="Enter your email"
            />
          </Field>
        </FieldGroup>
      ))}
    </div>
  ),
}
