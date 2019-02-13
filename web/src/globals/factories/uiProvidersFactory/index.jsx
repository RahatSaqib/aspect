import React from 'react'
import { MuiThemeProvider, jssPreset } from '@material-ui/core/styles'
import { create } from 'jss'
import { JssProvider } from 'react-jss'
import CssBaseline from '@material-ui/core/CssBaseline'

import theme from '../../../theme'

const jss = create({
  ...jssPreset(),
  insertionPoint: 'insertion-point-jss',
})

export const uiProvidersFactory = render => props => (
  <JssProvider jss={jss}>
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {render(props)}
    </MuiThemeProvider>
  </JssProvider>
)

export default uiProvidersFactory
