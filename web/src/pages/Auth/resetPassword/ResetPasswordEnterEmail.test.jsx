import React from 'react'
import { Button, TextField } from '@mui/material'
import { shallow } from 'enzyme'
import noop from 'lodash/noop'
import messages from './messages'
import { validate, ResetPasswordEnterEmail } from './ResetPasswordEnterEmail'

describe('ResetPasswordEnterEmail module', () => {
  const intl = { formatMessage: message => message.defaultMessage }
  const props = {
    intl,
    onShowAdminHelpDialog: noop,
    values: {},
    meta: {
      emailAddress: {},
    },
    onEmailAddressChange: noop,
    handleSubmit: noop,
  }

  describe('ResetPasswordEnterEmail component', () => {
    it('should shallow render without crash', () => {
      shallow(<ResetPasswordEnterEmail {...props} form={{}} />)
    })

    it('should disable the submit button when the form is pristine, invalid or submitting', () => {
      let wrapper = shallow(
        <ResetPasswordEnterEmail {...props} form={{ pristine: true, valid: false, submitting: false }} />
      )
      expect(wrapper.find(Button).filter({ type: 'submit' }).prop('disabled')).toBeTruthy()

      wrapper = shallow(
        <ResetPasswordEnterEmail {...props} form={{ pristine: false, valid: false, submitting: false }} />
      )
      expect(wrapper.find(Button).filter({ type: 'submit' }).prop('disabled')).toBeTruthy()

      wrapper = shallow(
        <ResetPasswordEnterEmail {...props} form={{ pristine: false, valid: true, submitting: true }} />
      )
      expect(wrapper.find(Button).filter({ type: 'submit' }).prop('disabled')).toBeTruthy()
    })

    it('should enable the submit button when the form is dirty, valid and not submitting', () => {
      const wrapper = shallow(
        <ResetPasswordEnterEmail {...props} form={{ pristine: false, valid: true, submitting: false }} />
      )

      expect(wrapper.find(Button).filter({ type: 'submit' }).prop('disabled')).toBeFalsy()
    })

    it('should show the error when the text field is touched and the email is invalid', () => {
      const wrapper = shallow(<ResetPasswordEnterEmail {...props} form={{}} />)
      expect(wrapper.find(TextField).prop('error')).toBeFalsy()
      expect(wrapper.find(TextField).prop('helperText')).toBeFalsy()

      wrapper.setProps({
        meta: { emailAddress: { touched: true, error: 'error-message' } },
      })
      expect(wrapper.find(TextField).prop('error')).toBeTruthy()
      expect(wrapper.find(TextField).prop('helperText')).toEqual('error-message')
    })
  })

  describe('validate function', () => {
    const invalidEmailAddress = intl.formatMessage(messages.invalidEmailAddress)
    it('should contain error message with invalid emails', () => {
      expect(validate({ emailAddress: '' }, props).emailAddress).toEqual(invalidEmailAddress)
      expect(validate({ emailAddress: 'test' }, props).emailAddress).toEqual(invalidEmailAddress)
      expect(validate({ emailAddress: 'test@example' }, props).emailAddress).toEqual(invalidEmailAddress)
    })

    it('should not contain an `emailAddress` property of error with valid emails', () => {
      expect(validate({ emailAddress: 'test@example.com' }, props)).not.toHaveProperty('emailAddress')
      expect(validate({ emailAddress: 'test@gmail.com' }, props)).not.toHaveProperty('emailAddress')
    })
  })
})
