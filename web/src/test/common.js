import { IntlProvider } from 'react-intl'
import { mount, shallow } from 'enzyme'
import translation from '../shared/i18n/translation'
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

export { shallowWithIntl, mountWithIntl }
