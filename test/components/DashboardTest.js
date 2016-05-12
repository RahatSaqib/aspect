import React from 'react'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import Snackbar from 'material-ui/Snackbar'
import theme from '../../src/theme'
import {
  renderIntoDocument,
  findRenderedDOMComponentWithClass,
  findRenderedComponentWithType
} from 'react-addons-test-utils'
import {Map} from 'immutable'
import {Dashboard} from '../../src/components/Dashboard'
import {assert} from 'chai'

describe('Dashboard', () => {

  let user = new Map({ name: 'Stefan Baumgartner' })

  it('renders an h1 with the class "content-h1" that says "Dashboard"', () => {

    let location = { search: 'asfd' }

    const component = renderIntoDocument(
      <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
        <Dashboard location={location} />
      </MuiThemeProvider>
    )
    const title = findRenderedDOMComponentWithClass(component, 'content-h1')
    assert.equal(title.innerText, 'Dashboard')
    assert.equal(title.className, 'content-h1')
  })

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
