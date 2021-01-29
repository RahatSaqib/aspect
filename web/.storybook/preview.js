import React from 'react'
import { IntlProvider } from 'react-intl'
import { MuiThemeProvider } from '@material-ui/core/styles'

import aspectTheme from '../src/theme/variables'

export const decorators = [
  Story => {
    const locale = 'en'
    const { theme } = aspectTheme
    return (
      <MuiThemeProvider theme={theme}>
        <IntlProvider locale={locale}>
          <Story />
        </IntlProvider>
      </MuiThemeProvider>
    )
  },
]

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
}
