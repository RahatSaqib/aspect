import React from 'react'
import {shallow} from 'enzyme'
import Immutable from 'immutable'
import {Dashboard} from './Dashboard'
import { assert } from 'chai'

describe('Dashboard', () => {

  const user = new Immutable.Map({ name: 'Stefan Baumgartner', lang: 'en' })
  const intl = {
    formatMessage: message => message.defaultMessage
  }

  it('shows the snackbar with user name if query string contains "fl=1"', () => {

    let location = { search: 'fl=1' }

    const Wrapper = shallow(<Dashboard location={location} user={user} intl={intl} />)
    const sb = Wrapper.find('Snackbar')
    assert.isTrue(sb.props().open)
  })

  it('doesn\'t show the snackbar with user name if query string does not contain "fl=1"', () => {

    let location = { search: 'test=2' }

    const Wrapper = shallow(<Dashboard location={location} user={user} intl={intl} />)
    const sb = Wrapper.find('Snackbar')
    assert.isFalse(sb.props().open)
  })
})
