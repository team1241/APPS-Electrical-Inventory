import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileIcon, XIcon } from 'lucide-react'

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment'

const sizes = ['default', 'sm', 'xs'] as const
const orientations = ['horizontal', 'vertical'] as const
const states = ['idle', 'uploading', 'processing', 'error', 'done'] as const

const meta = {
  title: 'UI/Attachment',
  component: Attachment,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: sizes,
    },
    orientation: {
      control: 'select',
      options: orientations,
    },
    state: {
      control: 'select',
      options: states,
    },
  },
  args: {
    size: 'default',
    orientation: 'horizontal',
    state: 'done',
  },
} satisfies Meta<typeof Attachment>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Attachment {...args}>
      <AttachmentMedia>
        <FileIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>report.pdf</AttachmentTitle>
        <AttachmentDescription>2.4 MB</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove attachment">
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  ),
}

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-3">
      {sizes.map((size) => (
        <Attachment key={size} size={size}>
          <AttachmentMedia>
            <FileIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>size: {size}</AttachmentTitle>
            <AttachmentDescription>2.4 MB</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      ))}
    </div>
  ),
}

export const Orientations: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-start gap-4">
      {orientations.map((orientation) => (
        <Attachment key={orientation} orientation={orientation}>
          <AttachmentMedia>
            <FileIcon />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{orientation}</AttachmentTitle>
            <AttachmentDescription>2.4 MB</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      ))}
    </div>
  ),
}
