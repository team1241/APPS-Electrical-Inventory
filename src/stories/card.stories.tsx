import type { Meta, StoryObj } from '@storybook/react-vite'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const sizes = ['default', 'sm'] as const

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: sizes,
    },
  },
  args: {
    size: 'default',
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Card className="w-[350px]" {...args}>
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one click.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Configure your project settings and deploy to production.</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Deploy</Button>
      </CardFooter>
    </Card>
  ),
}

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap gap-4">
      {sizes.map((size) => (
        <Card key={size} size={size} className="w-[280px]">
          <CardHeader>
            <CardTitle>size: {size}</CardTitle>
            <CardDescription>Card size variant preview.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Content for the {size} card.</p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
}
