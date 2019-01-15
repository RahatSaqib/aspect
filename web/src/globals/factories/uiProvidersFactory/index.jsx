import React from 'react'
import { MuiThemeProvider, jssPreset } from '@material-ui/core/styles'
import { create } from 'jss'
import { JssProvider } from 'react-jss'

import theme from '../../../theme'

const jss = create({
  ...jssPreset(),
  insertionPoint: 'insertion-point-jss',
})
// const generateId = createGenerateId()

export const uiProvidersFactory = render => props => (
  <JssProvider jss={jss}>
    <MuiThemeProvider theme={theme}>{render(props)}</MuiThemeProvider>
  </JssProvider>
)

export default uiProvidersFactory
