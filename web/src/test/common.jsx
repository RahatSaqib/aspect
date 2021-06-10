import React from 'react'
import { IntlProvider } from 'react-intl'
import { mount, shallow } from 'enzyme'
import { QueryClient, QueryClientProvider } from 'react-query'

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

export {
  // with intl
  shallowWithIntl,
  mountWithIntl,
  // with query
  mountWithQuery,
  shallowWithQuery,
}
