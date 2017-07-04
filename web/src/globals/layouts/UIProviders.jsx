import PropTypes from 'prop-types'
import React, { Children } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { connect } from 'react-redux'
import { addLocaleData, IntlProvider } from 'react-intl'
import en from 'react-intl/locale-data/en'
import fr from 'react-intl/locale-data/fr'

// Our own imports
import translation from '../../shared/i18n/translation.json'
import { getUsersTimezone } from '../../shared/utils/timezone'
import UIThemeProviders from './UIThemeProviders'

addLocaleData([...en, ...fr])

const DEFAULT_LOCALE = 'en-US'

const enhance = compose(
  setPropTypes({
    children: PropTypes.node.isRequired,
  }),
  pure,
  connect(state => ({
    locale: state.getIn(['user', 'culture']) || DEFAULT_LOCALE,
    timezone: getUsersTimezone(state.getIn(['user', 'timezone'])),
  }))
)

export const UIProviders = ({ children, locale, timezone }) => {
  const messages = translation[locale]
  const formats = {}

  if (timezone) {
    formats.date = {
      'user-timezone': {
        timeZone: timezone,
      },
      '2-digit-date-time': {
        // https://github.com/yahoo/react-intl/wiki/Components#date-formatting-components
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      },
    }
    formats.time = {
      'user-timezone': {
        timeZone: timezone,
      },
    }
  }

  return (
    <IntlProvider
      key={/* https://git.io/viGEA */ locale}
      locale={locale === 'en-US' ? 'en' : locale}
      formats={formats}
      messages={messages}
    >
      <UIThemeProviders>
        {Children.only(children)}
      </UIThemeProviders>
    </IntlProvider>
  )
}

export default enhance(UIProviders)
