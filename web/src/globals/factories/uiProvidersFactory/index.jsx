import React from 'react'
import { ThemeProvider } from 'react-css-themr'
import {
  MuiThemeProvider,
  createMuiTheme,
  jssPreset,
} from '@material-ui/core/styles'
import { create } from 'jss'
import { JssProvider } from 'react-jss'

import theme from '../../../theme'
import themedReactToolbox from '../../../components/themedReactToolbox'

const jss = create({
  ...jssPreset(),
  insertionPoint: 'insertion-point-jss',
})

export const uiProvidersFactory = render => props => (
  <JssProvider jss={jss}>
    <MuiThemeProvider theme={createMuiTheme(theme)}>
      <ThemeProvider theme={themedReactToolbox}>{render(props)}</ThemeProvider>
    </MuiThemeProvider>
  </JssProvider>
)

export default uiProvidersFactory
