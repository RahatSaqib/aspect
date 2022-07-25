import noop from 'lodash/noop'
import React from 'react'
import { shallow } from 'enzyme'
import { createIntl } from 'react-intl'
import Button from '@material-ui/core/Button'
import messages from './messages'

describe('ResetPasswordEnterPassword module', () => {
  const { validate, ResetPasswordEnterPassword } = require('./ResetPasswordEnterPassword')
  const intl = createIntl({ locale: 'en' })
  const props = {
    intl,
    values: { newPassword: '' },
    meta: {
      newPassword: {},
      confirmNewPassword: {},
    },
    onNewPasswordChange: noop,
    onConfirmNewPasswordChange: noop,
    handleSubmit: noop,
  }

  describe('ResetPasswordEnterPassword component', () => {
    it('should render without crash', () => {
      shallow(<ResetPasswordEnterPassword {...props} form={{}} />)
    })

    it('should disable the submit button when the form is pristine, invalid or submitting', () => {
      let wrapper = shallow(
        <ResetPasswordEnterPassword {...props} form={{ pristine: true, valid: false, submitting: false }} />
      )
      expect(wrapper.find(Button).filter({ type: 'submit' }).prop('disabled')).toBeTruthy()

      wrapper = shallow(
        <ResetPasswordEnterPassword {...props} form={{ pristine: false, valid: false, submitting: false }} />
      )
      expect(wrapper.find(Button).filter({ type: 'submit' }).prop('disabled')).toBeTruthy()

      wrapper = shallow(
        <ResetPasswordEnterPassword {...props} form={{ pristine: false, valid: true, submitting: true }} />
      )
      expect(wrapper.find(Button).filter({ type: 'submit' }).prop('disabled')).toBeTruthy()
    })

    it('should enable the submit button when the form is dirty, valid and not submitting', () => {
      const wrapper = shallow(
        <ResetPasswordEnterPassword {...props} form={{ pristine: false, valid: true, submitting: false }} />
      )

      expect(wrapper.find(Button).filter({ type: 'submit' }).prop('disabled')).toBeFalsy()
    })
  })

  describe('validate function', () => {
    const newPasswordTooShort = intl.formatMessage(messages.newPasswordTooShort)
    const newPasswordMustContainANumberOrSpecialCharacter = intl.formatMessage(
      messages.newPasswordMustContainANumberOrSpecialCharacter
    )
    const passwordsDoNotMatch = intl.formatMessage(messages.passwordsDoNotMatch)
    const newPasswordRequired = intl.formatMessage(messages.newPasswordRequired)

    it('should contain  a`newPasswordRequired` message with an empty password', () => {
      expect(validate({ newPassword: '' }, props).newPassword).toEqual(newPasswordRequired)
    })

    it('should contain a `newPasswordTooShort` message when the length of `newPassword` is less than 8', () => {
      expect(validate({ newPassword: 'abcdefg' }, props).newPassword).toEqual(newPasswordTooShort)
      expect(validate({ newPassword: ' abcdefg ' }, props).newPassword).toEqual(newPasswordTooShort)
      expect(validate({ newPassword: ' abcdefg ', confirmNewPassword: '' }, props).newPassword).toEqual(
        newPasswordTooShort
      )
      expect(validate({ newPassword: ' abcdefgh ', confirmNewPassword: '' }, props).newPassword).not.toEqual(
        newPasswordTooShort
      )
    })

    it('should contain at least one number or special character', () => {
      expect(validate({ newPassword: 'allcharacter', confirmNewPassword: '' }, props).newPassword).toEqual(
        newPasswordMustContainANumberOrSpecialCharacter
      )
      expect(validate({ newPassword: 'allcharacter1', confirmNewPassword: '' }, props)).not.toHaveProperty(
        'newPassword'
      )
      expect(validate({ newPassword: 'allcharacter$', confirmNewPassword: '' }, props)).not.toHaveProperty(
        'newPassword'
      )
      expect(validate({ newPassword: 'allcharacter1$', confirmNewPassword: '' }, props)).not.toHaveProperty(
        'newPassword'
      )
    })

    it('should only pass the password when the `newPassword` and `confirmNewPassword` are equal', () => {
      expect(
        validate(
          {
            newPassword: 'a-valid-pa$$word',
            confirmNewPassword: 'valid-but-not-$ame',
          },
          props
        ).confirmNewPassword
      ).toEqual(passwordsDoNotMatch)
      expect(
        validate(
          {
            newPassword: 'a-valid-pa$$word',
            confirmNewPassword: 'a-valid-pa$$word',
          },
          props
        )
      ).toEqual({})
    })
  })
})
