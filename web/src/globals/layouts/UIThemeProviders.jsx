import _ from 'lodash'
import React, { Children } from 'react'
import { ThemeProvider } from 'react-css-themr'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'

import themedReactToolbox from '../../components/themedReactToolbox'
import theme from '../../theme'

const enhance = _.identity

export const UIThemeProviders = ({ children }) =>
  <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
    <ThemeProvider theme={themedReactToolbox}>
      {Children.only(children)}
    </ThemeProvider>
  </MuiThemeProvider>

export default enhance(UIThemeProviders)
