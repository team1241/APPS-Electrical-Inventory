import type { Meta, StoryObj } from '@storybook/react-vite'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

const sides = ['left', 'right'] as const
const variants = ['sidebar', 'floating', 'inset'] as const
const collapsibles = ['offcanvas', 'icon', 'none'] as const

const meta = {
  title: 'UI/Sidebar',
  component: SidebarProvider,
  tags: ['autodocs'],
  argTypes: {
    side: {
      control: 'select',
      options: sides,
    },
    variant: {
      control: 'select',
      options: variants,
    },
    collapsible: {
      control: 'select',
      options: collapsibles,
    },
  },
  args: {
    side: 'left',
    variant: 'sidebar',
    collapsible: 'offcanvas',
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SidebarProvider> & {
  args: {
    side: (typeof sides)[number]
    variant: (typeof variants)[number]
    collapsible: (typeof collapsibles)[number]
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: ({ side, variant, collapsible }) => (
    <SidebarProvider>
      <Sidebar side={side} variant={variant} collapsible={collapsible}>
        <SidebarHeader>
          <span className="px-2 text-sm font-medium">App</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>Home</SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>Settings</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm font-medium">Dashboard</span>
        </header>
        <main className="p-4">
          <p className="text-sm text-muted-foreground">Main content area</p>
        </main>
      </SidebarInset>
    </SidebarProvider>
  ),
}

export const Variants: Story = {
  parameters: { controls: { disable: true }, layout: 'fullscreen' },
  render: () => (
    <div className="flex flex-col gap-8">
      {variants.map((variant) => (
        <div key={variant} className="h-[280px] overflow-hidden border">
          <SidebarProvider>
            <Sidebar variant={variant}>
              <SidebarHeader>
                <span className="px-2 text-sm font-medium">{variant}</span>
              </SidebarHeader>
              <SidebarContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>Home</SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>Settings</SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarContent>
            </Sidebar>
            <SidebarInset>
              <header className="flex h-12 items-center gap-2 border-b px-4">
                <SidebarTrigger />
                <span className="text-sm font-medium">{variant}</span>
              </header>
            </SidebarInset>
          </SidebarProvider>
        </div>
      ))}
    </div>
  ),
}
