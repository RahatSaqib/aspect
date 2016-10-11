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

require('./App.scss')
require('./pure-grids-responsive-min.scss')

addLocaleData([...en, ...fr])

class App extends PureComponent {

  static propTypes = {
    locale: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired
  }

  render() {
    const { locale } = this.props
    const messages = translation[locale]

    return (
      <IntlProvider
        key={/* https://git.io/viGEA */locale}
        locale={locale}
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
    locale: state.getIn(['user', 'lang']) || DEFAULT_LOCALE
  }
}

const DEFAULT_LOCALE = 'en'

export default connect(mapStateToProps)(App)
