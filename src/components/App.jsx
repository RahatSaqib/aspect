import React from 'react'
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
      <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
        {this.props.children}
      </MuiThemeProvider>
    )
  }
}

export default App
