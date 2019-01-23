import React from 'react'
import { ThemeProvider } from 'react-css-themr'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'

import theme from '../../../theme'
import themedReactToolbox from '../../../components/themedReactToolbox'

export const uiProvidersFactory = render => props => (
  <MuiThemeProvider theme={createMuiTheme(theme)}>
    <ThemeProvider theme={themedReactToolbox}>{render(props)}</ThemeProvider>
  </MuiThemeProvider>
)

export default uiProvidersFactory
