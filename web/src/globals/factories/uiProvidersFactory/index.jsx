import React from 'react'
import { ThemeProvider } from 'react-css-themr'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import { MuiPickersUtilsProvider } from 'material-ui-pickers'
import DateFnsUtils from '@date-io/date-fns'

import theme from '../../../theme'
import themedReactToolbox from '../../../components/themedReactToolbox'

export const uiProvidersFactory = render => props => (
  <MuiThemeProvider theme={createMuiTheme(theme)}>
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <ThemeProvider theme={themedReactToolbox}>{render(props)}</ThemeProvider>
    </MuiPickersUtilsProvider>
  </MuiThemeProvider>
)

export default uiProvidersFactory
