import React from 'react'
import { connect } from 'react-redux'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import PureRenderMixin from 'react-addons-pure-render-mixin'

import theme from '../theme'

require('styles/App.css')
require('styles/pure-grids-responsive-min.css')

class App extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
  }

  render() {
    return (
      // we set the currentlanguage as the key here to make sure that the
      // currentlanguage in the context is passed down to the children.
      // that way, the UI will be rerendered as soon as the user changes the language
      <MuiThemeProvider muiTheme={getMuiTheme(theme)} key={this.props.currentLanguage}>
        {this.props.children}
      </MuiThemeProvider>
    )
  }

  getChildContext() {
    return {
      currentLanguage: this.props.currentLanguage
    }
  }
}

App.propTypes = {
  children: React.PropTypes.object.isRequired
}

App.childContextTypes = {
  currentLanguage: React.PropTypes.string.isRequired
}

function mapStateToProps(state) {
  return {
    currentLanguage: state.get('user').toObject().lang
  }
}

export default connect(mapStateToProps)(App)
