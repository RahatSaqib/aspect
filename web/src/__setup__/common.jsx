import React from 'react'
import { createTheme, ThemeProvider } from '@mui/material'
import { mount, shallow } from 'enzyme'

const mountWithTheme = children => {
  const theme = createTheme()
  return mount(<ThemeProvider theme={theme}>{children}</ThemeProvider>)
}

const shallowWithTheme = children => {
  const theme = createTheme()
  return shallow(<ThemeProvider theme={theme}>{children}</ThemeProvider>)
}

export { mountWithTheme, shallowWithTheme }
