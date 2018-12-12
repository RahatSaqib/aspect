import React from 'react'
import { ThemeProvider } from 'react-css-themr'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
 import { MuiThemeProvider as V0MuiThemeProvider} from 'material-ui';
 import getMuiTheme from 'material-ui/styles/getMuiTheme'

import theme_v0 from '../../../theme_v0'
import theme from '../../../theme'
import themedReactToolbox from '../../../components/themedReactToolbox'

export const uiProvidersFactory = render => props => (
  <MuiThemeProvider theme={createMuiTheme(theme)}>
    <V0MuiThemeProvider muiTheme={getMuiTheme(theme_v0)}>
      <ThemeProvider theme={themedReactToolbox}>{render(props)}</ThemeProvider>
    </V0MuiThemeProvider>
  </MuiThemeProvider>
)

export default uiProvidersFactory
