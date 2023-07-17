/* eslint-disable security/detect-non-literal-fs-filename */
import React from 'react'
import { shallow } from 'enzyme'
import noop from 'lodash/noop'
import AspectDialog from '../../../oldComponents/shared/AspectDialog'
import ResetPasswordEnterEmail from './ResetPasswordEnterEmail'

describe('ResetPassword module', () => {
  const { ResetPassword } = require('./ResetPassword')

  describe('ResetPassword Component', () => {
    let props
    let ResetPasswordWrapper

    const shallowRenderResetPassword = () => {
      ResetPasswordWrapper = shallow(<ResetPassword {...props} />)
    }

    beforeEach(() => {
      props = {
        resetPasswordEnterEmailAddress: () => {},
        resetPasswordEnterPassword: () => {},
        showAcknowledgement: () => {},
        showError: () => {},
        intl: {
          formatMessage: message => message.defaultMessage,
        },
        searchParams: new URLSearchParams(),
      }
      shallowRenderResetPassword()
    })

    it('should be a div', () => {
      expect(ResetPasswordWrapper.getElement().type).toEqual('div')
    })

    describe('admin help dialog', () => {
      it('should contain a hidden admin help dialog', () => {
        const adminHelpDialog = ResetPasswordWrapper.find(AspectDialog)

        expect(adminHelpDialog.props().title).toEqual('Request a New Password From Aspect')
        expect(adminHelpDialog.props().open).toBe(false)
        expect(adminHelpDialog.children().props().id).toEqual('pages.ResetPassword.adminHelpContent')
        expect({}.hasOwnProperty.call(adminHelpDialog.children().props().values, 'supportEmail')).toBe(true)
      })

      it('should show a dialog when user requests help', () => {
        const resetPasswordEnterEmail = ResetPasswordWrapper.find(ResetPasswordEnterEmail).first()
        resetPasswordEnterEmail.props().onShowAdminHelpDialog({ preventDefault: noop })
        ResetPasswordWrapper.update()

        const adminHelpDialog = ResetPasswordWrapper.find(AspectDialog)
        expect(adminHelpDialog.props().open).toBe(true)
      })
    })
  })
})
