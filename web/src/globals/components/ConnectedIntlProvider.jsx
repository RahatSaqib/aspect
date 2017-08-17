import { connect } from 'react-redux'
import { addLocaleData, IntlProvider } from 'react-intl'

import en from 'react-intl/locale-data/en'
import fr from 'react-intl/locale-data/fr'

import translation from '../../shared/i18n/translation'
import { getUsersTimezone } from '../../shared/utils/timezone'

addLocaleData([...en, ...fr])

const DEFAULT_LOCALE = 'en-US'

const enhance = connect(state => {
  const locale = state.getIn(['user', 'culture']) || DEFAULT_LOCALE
  const messages = translation[locale]
  const formats = {}

  const timezone = getUsersTimezone(state.getIn(['user', 'timezone']))
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

  return {
    key: /* https://git.io/viGEA */ locale,
    locale: locale === 'en-US' ? 'en' : locale,
    messages,
    formats,
  }
})

export default enhance(IntlProvider)
