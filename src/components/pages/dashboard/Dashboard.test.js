import React from 'react'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import theme from '../../../theme'
import {mount} from 'enzyme'
import Immutable from 'immutable'
import {Dashboard} from './Dashboard'
import expect from 'expect'

describe('Dashboard', () => {

  const user = new Immutable.Map({ name: 'Stefan Baumgartner' }), strings = { culture: 'en-US' }

  it('shows the snackbar with user name if query string contains "fl=1"', () => {

    let location = { search: 'fl=1' }

    const Wrapper = mount(
      <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
        <Dashboard location={location} user={user} strings={strings} />
      </MuiThemeProvider>
    )
    const sb = Wrapper.find('Snackbar')
    expect(sb.props().open).toBeTruthy()
  })

  it('doesn\'t show the snackbar with user name if query string does not contain "fl=1"', () => {

    let location = { search: 'test=2' }

    const Wrapper = mount(
      <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
        <Dashboard location={location} user={user} strings={strings} />
      </MuiThemeProvider>
    )
    const sb = Wrapper.find('Snackbar')
    expect(sb.props().open).toBeFalsy()
  })
})
