// Imports from packages
import React, { PureComponent, PropTypes } from 'react'
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
import {getUsersTimezone} from '../../shared/utils/timezone'

require('./App.scss')
require('./pure-grids-responsive-min.scss')

addLocaleData([...en, ...fr])

class App extends PureComponent {

  static propTypes = {
    locale: PropTypes.string.isRequired,
    timezone: PropTypes.string,
    children: PropTypes.node.isRequired
  }

  render() {
    const { locale, timezone } = this.props
    const messages = translation[locale]
    const formats = {}

    if(timezone) {
      formats.date = {
        'user-timezone': {
          timeZone: timezone
        },
        '2-digit-date-time': {
          // https://github.com/yahoo/react-intl/wiki/Components#date-formatting-components
          year  : '2-digit',
          month : '2-digit',
          day   : '2-digit',
          hour  : '2-digit',
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
          {this.props.children}
        </MuiThemeProvider>
      </IntlProvider>
    )
  }
}

function mapStateToProps(state) {
  return {
    locale: state.getIn(['user', 'culture']) || DEFAULT_LOCALE,
    timezone: getUsersTimezone(state.getIn(['user', 'timezone']))
  }
}

const DEFAULT_LOCALE = 'en-US'

export default connect(mapStateToProps)(App)
