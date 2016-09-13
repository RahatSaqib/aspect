import React from 'react'
import {IntlProvider} from 'react-intl'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import theme from '../../../theme'
import {mount} from 'enzyme'
import Immutable from 'immutable'
import {Dashboard} from './Dashboard'
import { assert } from 'chai'

describe('Dashboard', () => {

  const user = new Immutable.Map({ name: 'Stefan Baumgartner' })
  let intl

  before(() => {
    const intlProvider = new IntlProvider({locale: 'en'}, {})
    intl = intlProvider.getChildContext().intl
  })

  it('shows the snackbar with user name if query string contains "fl=1"', () => {

    let location = { search: 'fl=1' }

    const Wrapper = mount(
      <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
        <Dashboard location={location} user={user} intl={intl} />
      </MuiThemeProvider>
    )
    const sb = Wrapper.find('Snackbar')
    assert.isTrue(sb.props().open)
  })

  it('doesn\'t show the snackbar with user name if query string does not contain "fl=1"', () => {

    let location = { search: 'test=2' }

    const Wrapper = mount(
      <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
        <Dashboard location={location} user={user} intl={intl} />
      </MuiThemeProvider>
    )
    const sb = Wrapper.find('Snackbar')
    assert.isFalse(sb.props().open)
  })
})
