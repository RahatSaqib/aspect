import React from 'react'
import { IntlProvider } from 'react-intl'
import { ThemeProvider } from '@mui/material/styles'

import aspectTheme from '../src/theme/variables'

export const decorators = [
  Story => {
    const locale = 'en'
    const { theme } = aspectTheme
    return (
      <ThemeProvider theme={theme}>
        <IntlProvider locale={locale}>
          <Story />
        </IntlProvider>
      </ThemeProvider>
    )
  },
]

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
}
