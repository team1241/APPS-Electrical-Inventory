import { addons } from 'storybook/manager-api'
import { create, themes } from 'storybook/theming'

addons.setConfig({
  theme: create({
    ...themes.dark,
    brandTitle: 'Theory6 Apps',
    brandImage: '/theory6-apps-logo.jpg',
    brandTarget: '_self',
  }),
})
