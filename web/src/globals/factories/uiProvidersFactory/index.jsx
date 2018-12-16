import React from 'react'
import { ThemeProvider } from 'react-css-themr'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import { MuiThemeProvider as V0MuiThemeProvider } from 'material-ui'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import { MuiPickersUtilsProvider } from 'material-ui-pickers'
import DateFnsUtils from '@date-io/date-fns'

import themeV0 from '../../../theme_v0'
import theme from '../../../theme'
import themedReactToolbox from '../../../components/themedReactToolbox'

export const uiProvidersFactory = render => props => (
  <MuiThemeProvider theme={createMuiTheme(theme)}>
    <V0MuiThemeProvider muiTheme={getMuiTheme(themeV0)}>
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <ThemeProvider theme={themedReactToolbox}>
          {render(props)}
        </ThemeProvider>
      </MuiPickersUtilsProvider>
    </V0MuiThemeProvider>
  </MuiThemeProvider>
)

export default uiProvidersFactory
