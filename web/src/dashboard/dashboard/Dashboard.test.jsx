import _ from 'lodash'
import React from 'react'
import sinon from 'sinon'
import { mount } from 'enzyme'
import Immutable from 'immutable'

import { Dashboard } from './Dashboard'

function makeLocationObject(query) {
  return { query }
}

describe('Dashboard', () => {
  const user = new Immutable.Map({ name: 'Stefan Baumgartner', culture: 'en-US', timezone: null })
  const intl = {
    formatMessage: message => message.defaultMessage
  }

  context('React lifecycles', () => {
    let renderStub
    before(() => {
      renderStub = sinon.stub(Dashboard.prototype, 'render', () => false)
    })

    after(() => {
      renderStub.restore()
    })

    context('if query string contains "fl=1', () => {
      it('calls showAcknowledgement with user name when receiving new user', () => {
        const location = makeLocationObject({ fl: '1' })
        const showAcknowledgement = sinon.stub()

        const Wrapper = mount(
          <Dashboard
            setPageTitle={_.noop}
            showAcknowledgement={showAcknowledgement}
            location={location}
            userName=""
            intl={intl}
          />
        )
        expect(showAcknowledgement.notCalled).toBe(true)

        Wrapper.setProps({
          userName: user.get('name')
        })
        expect(showAcknowledgement.called).toBe(true)
      })
    })

    context('if query string oes not contains "fl=1', () => {
      it('calls showAcknowledgement with user name when receiving new user', () => {
        const location = makeLocationObject({ test: '2' })
        const showAcknowledgement = sinon.stub()

        const Wrapper = mount(
          <Dashboard
            setPageTitle={_.noop}
            showAcknowledgement={showAcknowledgement}
            location={location}
            userName=""
            intl={intl}
          />
        )

        expect(showAcknowledgement.notCalled).toBe(true)

        Wrapper.setProps({
          userName: user.get('name')
        })
        expect(showAcknowledgement.notCalled).toBe(true)
      })
    })
  })
})
