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

// eslint-disable-next-line import/no-unused-modules
export { mountWithTheme, shallowWithTheme }
