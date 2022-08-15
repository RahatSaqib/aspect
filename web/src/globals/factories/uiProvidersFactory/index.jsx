import React from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { jssPreset } from '@mui/styles'
import { create } from 'jss'
import { JssProvider } from 'react-jss'

import theme from '../../../theme'

const jss = create({
  ...jssPreset(),
  insertionPoint: 'insertion-point-jss',
})
// const generateId = createGenerateId()

export const uiProvidersFactory = render => props =>
  (
    <JssProvider jss={jss}>
      <ThemeProvider theme={theme}>{render(props)}</ThemeProvider>
    </JssProvider>
  )

export default uiProvidersFactory
