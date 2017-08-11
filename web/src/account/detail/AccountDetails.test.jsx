import _ from 'lodash'
import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'

import { AccountDetailsData } from '../AccountRedux'

describe('AccountDetails module', () => {
  const { AccountDetails } = require('./AccountDetails')

  describe('AccountDetails component', () => {
    const renderer = new ReactShallowRenderer()
    const props = {
      intl: {
        formatMessage: message => message.defaultMessage,
      },
      loading: false,
      saving: false,
      accountDetails: new AccountDetailsData(),
      showAcknowledgement: _.noop,
      fetchAccountDetails: _.noop,
      saveContactDetails: _.noop,
      saveLoginDetails: _.noop,
      saveUserPreferences: _.noop,
    }

    it('should shallow render correctly', () => {
      const element = renderer.render(<AccountDetails {...props} />)

      expect(element).toMatchSnapshot()
    })

    describe('when loading is true', () => {
      it('should show a progress bar in each tab', () => {
        const element = renderer.render(<AccountDetails {...props} loading />)

        expect(element).toMatchSnapshot()
      })
    })
  })
})
