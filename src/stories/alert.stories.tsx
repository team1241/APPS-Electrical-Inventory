import type { Meta, StoryObj } from '@storybook/react-vite'
import { InfoIcon } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const variants = ['default', 'destructive'] as const

const meta = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: variants,
    },
  },
  args: {
    variant: 'default',
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Alert {...args}>
      <InfoIcon />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the CLI.
      </AlertDescription>
    </Alert>
  ),
}

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-full max-w-lg flex-col gap-4">
      {variants.map((variant) => (
        <Alert key={variant} variant={variant}>
          <InfoIcon />
          <AlertTitle>{variant}</AlertTitle>
          <AlertDescription>
            This is a {variant} alert with a short description.
          </AlertDescription>
        </Alert>
      ))}
    </div>
  ),
}
