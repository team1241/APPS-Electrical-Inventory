import type { Meta, StoryObj } from '@storybook/react-vite'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const variants = ['default', 'line'] as const

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: variants,
      description: 'TabsList variant',
    },
  },
  args: {
    variant: 'default',
  },
} satisfies Meta<typeof Tabs> & { args: { variant: (typeof variants)[number] } }

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: ({ variant }) => (
    <Tabs defaultValue="account">
      <TabsList variant={variant}>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        Make changes to your account here.
      </TabsContent>
      <TabsContent value="password">Change your password here.</TabsContent>
    </Tabs>
  ),
}

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-8">
      {variants.map((variant) => (
        <Tabs key={variant} defaultValue="account">
          <TabsList variant={variant}>
            <TabsTrigger value="account">{variant}</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            {variant} tabs list style.
          </TabsContent>
          <TabsContent value="password">Change your password here.</TabsContent>
        </Tabs>
      ))}
    </div>
  ),
}
