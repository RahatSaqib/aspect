import React from 'react'
import { ThemeProvider } from 'react-css-themr'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'

import theme from '../../../theme'
import themedReactToolbox from '../../../components/themedReactToolbox'

export const uiProvidersFactory = render => props => (
  <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
    <ThemeProvider theme={themedReactToolbox}>{render(props)}</ThemeProvider>
  </MuiThemeProvider>
)

export default uiProvidersFactory
