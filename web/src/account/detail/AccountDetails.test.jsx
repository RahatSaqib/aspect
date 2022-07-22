import noop from 'lodash/noop'
import React from 'react'
import { shallow } from 'enzyme'
import { Route } from 'react-router-dom'
import LinearProgress from '@material-ui/core/LinearProgress'

import { AccountDetailsData } from '../AccountRedux'

describe('AccountDetails module', () => {
  const { AccountDetails } = require('./AccountDetails')

  describe('AccountDetails component', () => {
    const props = {
      intl: {
        formatMessage: message => message.defaultMessage,
      },
      loading: false,
      saving: false,
      accountDetails: new AccountDetailsData(),
      showAcknowledgement: noop,
      fetchAccountDetails: noop,
      saveContactDetails: noop,
      saveLoginDetails: noop,
      saveUserPreferences: noop,
      navigate: () => {},
      location: { pathname: '' },
      params: {},
    }

    it('should shallow render correctly', () => {
      const element = shallow(<AccountDetails {...props} />)

      expect(element).toMatchSnapshot()
    })

    describe('loading status', () => {
      it('should show a progress bar in each tab', () => {
        const wrapper = shallow(<AccountDetails {...props} loading />)
        const results = wrapper.find(Route)

        expect(results).toHaveLength(2)
        results.forEach(route => {
          expect(route.find(LinearProgress)).toBeDefined()
        })
      })
    })

    describe('dialog', () => {
      const saveLoginDetailsSuccess = () => Promise.resolve()
      const saveLoginDetailsWithOtherError = () => Promise.reject({ otherError: 'other-error-message' }) // eslint-disable-line prefer-promise-reject-errors
      const saveLoginDetailsWithCurrentPasswordError = () =>
        Promise.reject({ currentPassword: 'currentPassword-error' }) // eslint-disable-line prefer-promise-reject-errors

      let wrapper

      beforeEach(() => {
        wrapper = shallow(<AccountDetails {...props} />)
      })

      afterEach(() => {
        wrapper = null
      })

      it('should close the `CurrentPasswordInputDialog` when saves the login detail successfully', () => {
        wrapper.setProps({ saveLoginDetails: saveLoginDetailsSuccess })

        const instance = wrapper.instance()

        instance.openCurrentPasswordInputDialog()
        expect(wrapper.state('currentPasswordInputDialogOpen')).toBe(true)

        instance.handleSaveLoginDetails().then(() => {
          expect(wrapper.state('currentPasswordInputDialogOpen')).toBe(false)
        })
      })

      it('should not close the `CurrentPasswordInputDialog` when the error is not `currentPassword`', () => {
        wrapper.setProps({ saveLoginDetails: saveLoginDetailsWithOtherError })

        const instance = wrapper.instance()
        instance.openCurrentPasswordInputDialog()
        expect(wrapper.state('currentPasswordInputDialogOpen')).toBe(true)

        instance.handleSaveLoginDetails().catch(() => {
          expect(wrapper.state('currentPasswordInputDialogOpen')).toBe(true)
        })
      })

      it('should not close the `CurrentPasswordInputDialog` when the error is `currentPassword`', () => {
        wrapper.setProps({
          saveLoginDetails: saveLoginDetailsWithCurrentPasswordError,
        })

        const instance = wrapper.instance()
        instance.openCurrentPasswordInputDialog()
        expect(wrapper.state('currentPasswordInputDialogOpen')).toBe(true)

        instance.handleSaveLoginDetails().catch(() => {
          expect(wrapper.state('currentPasswordInputDialogOpen')).toBe(false)
        })
      })
    })

    describe('lifecycle', () => {
      describe('componentDidMount', () => {
        it('should invoke `fetchAccountDetails` when the component is mounted', () => {
          const fetchAccountDetails = jest.fn()
          shallow(<AccountDetails {...props} fetchAccountDetails={fetchAccountDetails} />)
          expect(fetchAccountDetails).toBeCalled()
        })
      })
    })
  })
})
