import React from 'react'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import Snackbar from 'material-ui/Snackbar'
import theme from '../../src/theme'
import {
  renderIntoDocument,
  findRenderedComponentWithType
} from 'react-addons-test-utils'
import Immutable from 'immutable'
import {Dashboard} from '../../src/components/pages/dashboard/Dashboard'
import {assert} from 'chai'

describe('Dashboard', () => {

  let user = new Immutable.Map({ name: 'Stefan Baumgartner' })

  it('shows the snackbar with user name if query string contains "fl=1"', () => {

    let location = { search: 'fl=1' }

    const component = renderIntoDocument(
      <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
        <Dashboard location={location} user={user} />
      </MuiThemeProvider>
    )
    const sb = findRenderedComponentWithType(component, Snackbar)
    assert.isTrue(sb.props.open)
  })

  it('doesn\'t show the snackbar with user name if query string does not contain "fl=1"', () => {

    let location = { search: 'test=2' }

    const component = renderIntoDocument(
      <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
        <Dashboard location={location} user={user} />
      </MuiThemeProvider>
    )
    const sb = findRenderedComponentWithType(component, Snackbar)
    assert.isFalse(sb.props.open)
  })
})
