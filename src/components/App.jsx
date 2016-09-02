// Imports from packages
import React from 'react'
import { connect } from 'react-redux'

// Material-UI
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'

// Our own imports
import theme from '../theme'

require('styles/App.css')
require('styles/pure-grids-responsive-min.css')

class App extends React.PureComponent {

  static propTypes = {
    children: React.PropTypes.object.isRequired
  }

  static childContextTypes = {
    currentLanguage: React.PropTypes.string,
    currentCulture: React.PropTypes.string
  }

  render() {
    return (
      // we set the currentlanguage as the key here to make sure that the
      // currentlanguage in the context is passed down to the children.
      // that way, the UI will be rerendered as soon as the user changes the language/culture
      <MuiThemeProvider muiTheme={getMuiTheme(theme)} key={this.props.currentLanguage}>
        {this.props.children}
      </MuiThemeProvider>
    )
  }

  getChildContext() {
    return {
      currentLanguage: this.props.currentLanguage,
      currentCulture: this.props.currentCulture
    }
  }
}

function mapStateToProps(state) {
  return {
    currentLanguage: state.getIn(['user', 'lang']),
    currentCulture: state.getIn(['user', 'culture'])
  }
}

export default connect(mapStateToProps)(App)
