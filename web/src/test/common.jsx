import React from 'react'
import { IntlProvider } from 'react-intl'
import { mount, shallow } from 'enzyme'
import { QueryClient, QueryClientProvider } from 'react-query'
import { createTheme, ThemeProvider } from '@mui/material/styles'

import translation from '../shared/i18n/translation'
import { I18nProvider } from '../Providers/I18nProvider'

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

const mountWithI18n = children => {
  return mount(<I18nProvider>{children}</I18nProvider>)
}

const shallowWithI18n = children => {
  return shallow(<I18nProvider>{children}</I18nProvider>)
}

const shallowWithQuery = children => {
  return shallow(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>)
}

const mountWithQuery = children => {
  return mount(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>)
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
  // with i18n provider
  mountWithI18n,
  shallowWithI18n,
}
