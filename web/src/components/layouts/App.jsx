import PropTypes from 'prop-types'
// Imports from packages
import React from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { connect } from 'react-redux'
import {
  addLocaleData,
  IntlProvider
} from 'react-intl'
import en from 'react-intl/locale-data/en'
import fr from 'react-intl/locale-data/fr'

// Material-UI
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'

// Our own imports
import translation from '../../shared/i18n/translation.json'
import theme from '../../theme'
import { getUsersTimezone } from '../../shared/utils/timezone'

require('./App.scss')

addLocaleData([...en, ...fr])

const DEFAULT_LOCALE = 'en-US'

function mapStateToProps(state) {
  return {
    locale: state.getIn(['user', 'culture']) || DEFAULT_LOCALE,
    timezone: getUsersTimezone(state.getIn(['user', 'timezone']))
  }
}

const enhance = compose(
  setPropTypes({
    children: PropTypes.node.isRequired
  }),
  pure,
  connect(mapStateToProps),
  setPropTypes({
    locale: PropTypes.string.isRequired,
    timezone: PropTypes.string
  })
)

export const App = ({ children, locale, timezone }) => {
  const messages = translation[locale]
  const formats = {}

  if (timezone) {
    formats.date = {
      'user-timezone': {
        timeZone: timezone
      },
      '2-digit-date-time': {
        // https://github.com/yahoo/react-intl/wiki/Components#date-formatting-components
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }
    }
    formats.time = {
      'user-timezone': {
        timeZone: timezone
      }
    }
  }

  return (
    <IntlProvider
      key={/* https://git.io/viGEA */locale}
      locale={locale === 'en-US' ? 'en' : locale}
      formats={formats}
      messages={messages}
    >
      <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
        {children}
      </MuiThemeProvider>
    </IntlProvider>
  )
}

export const AppContainer = enhance(App)

export default AppContainer
