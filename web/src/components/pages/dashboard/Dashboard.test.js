import React from 'react'
import {IntlProvider} from 'react-intl'
import translation from '../../../i18n/translation.json'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import theme from '../../../theme'
import {mount} from 'enzyme'
import Immutable from 'immutable'
import {Dashboard} from './Dashboard'
import { assert } from 'chai'

describe('Dashboard', () => {

  const user = new Immutable.Map({ name: 'Stefan Baumgartner', lang: 'en' })
  let intl, messages

  before(() => {
    const intlProvider = new IntlProvider({locale: user.get('lang')}, {})
    intl = intlProvider.getChildContext().intl
    messages = translation[user.get('lang')]
  })

  it('shows the snackbar with user name if query string contains "fl=1"', () => {

    let location = { search: 'fl=1' }

    const Wrapper = mount(
      <IntlProvider key={user.get('lang')} locale={user.get('lang')} messages={messages}>
        <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
          <Dashboard location={location} user={user} intl={intl} />
        </MuiThemeProvider>
      </IntlProvider>
    )
    const sb = Wrapper.find('Snackbar')
    assert.isTrue(sb.props().open)
  })

  it('doesn\'t show the snackbar with user name if query string does not contain "fl=1"', () => {

    let location = { search: 'test=2' }

    const Wrapper = mount(
      <IntlProvider key={user.get('lang')} locale={user.get('lang')} messages={messages}>
        <MuiThemeProvider muiTheme={getMuiTheme(theme)}>
          <Dashboard location={location} user={user} intl={intl} />
        </MuiThemeProvider>
      </IntlProvider>
    )
    const sb = Wrapper.find('Snackbar')
    assert.isFalse(sb.props().open)
  })
})
