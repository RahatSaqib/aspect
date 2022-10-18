import React from 'react'
import noop from 'lodash/noop'
import { createIntl } from 'react-intl'
import ReactShallowRenderer from 'react-test-renderer/shallow'

describe('LoginDetailsForm module', () => {
  const { validate, LoginDetailsForm } = require('./LoginDetailsForm')

  const props = {
    intl: createIntl({ locale: 'en' }),
    loading: false,
    onSubmit: noop,
    values: { newPassword: '' },
    meta: {
      username: {},
      newPassword: {},
      confirmNewPassword: {},
      currentPassword: {},
    },
    onUsernameChange: noop,
    onNewPasswordChange: noop,
    onConfirmNewPasswordChange: noop,
    onCurrentPasswordChange: noop,
    onCurrentPasswordKeyPress: noop,
    handleSubmit: noop,
  }

  describe('LoginDetailsForm component', () => {
    const renderer = ReactShallowRenderer.createRenderer()

    it('should render correctly', () => {
      const element = renderer.render(<LoginDetailsForm {...props} form={{}} />)
      expect(element).toMatchSnapshot()
    })

    it('should disable all fields when form is loading', () => {
      const element = renderer.render(<LoginDetailsForm {...props} form={{}} loading />)
      expect(element).toMatchSnapshot()
    })

    it('should disable the submit button when the form is pristine, invalid or submitting', () => {
      let element = renderer.render(
        <LoginDetailsForm {...props} form={{ pristine: true, valid: false, submitting: false }} />
      )
      expect(element).toMatchSnapshot()

      element = renderer.render(
        <LoginDetailsForm {...props} form={{ pristine: false, valid: false, submitting: false }} />
      )
      expect(element).toMatchSnapshot()

      element = renderer.render(
        <LoginDetailsForm {...props} form={{ pristine: false, valid: true, submitting: true }} />
      )
      expect(element).toMatchSnapshot()
    })

    it('should enable the submit button when the form is dirty, valid and not submitting', () => {
      const element = renderer.render(
        <LoginDetailsForm {...props} form={{ pristine: false, valid: true, submitting: false }} />
      )
      expect(element).toMatchSnapshot()
    })
  })

  describe('validate function', () => {
    it('should validate that a username has been entered', () => {
      expect(validate({ username: '' }, props)).toMatchSnapshot()
    })

    it('should validate password if it has been entered', () => {
      expect(validate({ newPassword: 'invalid' }, props)).toMatchSnapshot()
      expect(
        validate(
          {
            newPassword: 'lessInvalid',
            confirmNewPassword: 'lessInvalid',
          },
          props
        )
      ).toMatchSnapshot()
      expect(
        validate(
          {
            newPassword: 'valid123',
            confirmNewPassword: 'lessInvalid',
          },
          props
        )
      ).toMatchSnapshot()
      expect(
        validate(
          {
            newPassword: 'valid123',
            confirmNewPassword: 'valid123',
          },
          props
        )
      ).toMatchSnapshot()
    })
  })
})
