import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileIcon } from 'lucide-react'

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'

const variants = ['default', 'outline', 'muted'] as const
const sizes = ['default', 'sm', 'xs'] as const

const meta = {
  title: 'UI/Item',
  component: Item,
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
  },
  args: {
    variant: 'outline',
    size: 'default',
  },
} satisfies Meta<typeof Item>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <ItemGroup className="max-w-md">
      <Item {...args}>
        <ItemMedia variant="icon">
          <FileIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Document.pdf</ItemTitle>
          <ItemDescription>Uploaded 2 hours ago</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
}

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <ItemGroup className="max-w-md">
      {variants.map((variant) => (
        <Item key={variant} variant={variant}>
          <ItemMedia variant="icon">
            <FileIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{variant}</ItemTitle>
            <ItemDescription>Item variant preview</ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  ),
}

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <ItemGroup className="max-w-md">
      {sizes.map((size) => (
        <Item key={size} variant="outline" size={size}>
          <ItemMedia variant="icon">
            <FileIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>size: {size}</ItemTitle>
            <ItemDescription>Item size preview</ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  ),
}
