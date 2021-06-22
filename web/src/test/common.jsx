import React from 'react'
import { IntlProvider } from 'react-intl'
import { mount, shallow } from 'enzyme'
import { QueryClient, QueryClientProvider } from 'react-query'
import { createTheme, ThemeProvider } from '@material-ui/core/styles'

import translation from '../shared/i18n/translation'

const queryClient = new QueryClient()

// en-US.json
const defaultLocale = 'en'
const locale = defaultLocale
const messages = translation[locale]
const mountWithIntl = node => {
  return mount(node, {
    wrappingComponent: IntlProvider,
    wrappingComponentProps: {
      locale,
      defaultLocale,
      messages,
    },
  })
}

const shallowWithIntl = node => {
  return shallow(node, {
    wrappingComponent: IntlProvider,
    wrappingComponentProps: {
      locale,
      messages,
    },
  })
}

const shallowWithQuery = children => {
  return shallow(
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const mountWithQuery = children => {
  return mount(
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const mountWithTheme = children => {
  const theme = createTheme()
  return mount(<ThemeProvider theme={theme}>{children}</ThemeProvider>)
}

const shallowWithTheme = children => {
  const theme = createTheme()
  return shallow(<ThemeProvider theme={theme}>{children}</ThemeProvider>)
}

export {
  // with intl
  shallowWithIntl,
  mountWithIntl,
  // with query
  mountWithQuery,
  shallowWithQuery,
  // with theme
  mountWithTheme,
  shallowWithTheme,
}
