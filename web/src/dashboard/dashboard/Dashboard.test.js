import _ from 'lodash'
import React from 'react'
import sinon from 'sinon'
import {mount} from 'enzyme'
import Immutable from 'immutable'
import { assert } from 'chai'

import {Dashboard} from './Dashboard'

function makeLocationObject(query) {
  return { query }
}

describe('Dashboard', () => {

  const user = new Immutable.Map({ name: 'Stefan Baumgartner', lang: 'en', timezone: null })
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
      it('calls addAcknowledgement with user name when receiving new user', () => {
        const location = makeLocationObject({ fl: '1' })
        const addAcknowledgement = sinon.stub()

        const Wrapper = mount(
          <Dashboard
            setPageTitle={_.noop}
            addAcknowledgement={addAcknowledgement}
            location={location}
            userName=""
            intl={intl}
          />
        )
        assert.isTrue(addAcknowledgement.notCalled)

        Wrapper.setProps({
          userName: user.get('name')
        })
        assert.isTrue(addAcknowledgement.called)
      })
    })

    context('if query string oes not contains "fl=1', () => {
      it('calls addAcknowledgement with user name when receiving new user', () => {
        const location = makeLocationObject({ test: '2' })
        const addAcknowledgement = sinon.stub()

        const Wrapper = mount(
          <Dashboard
            setPageTitle={_.noop}
            addAcknowledgement={addAcknowledgement}
            location={location}
            userName=""
            intl={intl}
          />
        )

        assert.isTrue(addAcknowledgement.notCalled)

        Wrapper.setProps({
          userName: user.get('name')
        })
        assert.isTrue(addAcknowledgement.notCalled)
      })
    })
  })
})
