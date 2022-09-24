import React from 'react'
import { createTheme } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { mount, shallow } from 'enzyme'
import { IntlProvider } from 'react-intl'
import { QueryClient, QueryClientProvider } from 'react-query'
import { I18nProvider } from '../providers/I18nProvider'
import translation from '../utils/i18n/translation'

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
