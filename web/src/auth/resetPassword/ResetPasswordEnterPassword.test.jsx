import _ from 'lodash'
import React from 'react'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { IntlProvider } from 'react-intl'

describe('ResetPasswordEnterPassword module', () => {
  const {
    validate,
    ResetPasswordEnterPassword,
  } = require('./ResetPasswordEnterPassword')
  const intlProvider = new IntlProvider({ locale: 'en' }, {})
  const { intl } = intlProvider.getChildContext()
  const renderer = ReactShallowRenderer.createRenderer()
  const props = {
    intl,
    values: { newPassword: '' },
    meta: {
      newPassword: {},
      confirmNewPassword: {},
    },
    onNewPasswordChange: _.noop,
    onConfirmNewPasswordChange: _.noop,
    handleSubmit: _.noop,
  }

  describe('ResetPasswordEnterPassword component', () => {
    it('should render correctly', () => {
      const element = renderer.render(
        <ResetPasswordEnterPassword {...props} form={{}} />
      )
      expect(element).toMatchSnapshot()
    })

    it('should disable the submit button when the form is pristine, invalid or submitting', () => {
      let element = renderer.render(
        <ResetPasswordEnterPassword
          {...props}
          form={{ pristine: true, valid: false, submitting: false }}
        />
      )
      expect(element).toMatchSnapshot()

      element = renderer.render(
        <ResetPasswordEnterPassword
          {...props}
          form={{ pristine: false, valid: false, submitting: false }}
        />
      )
      expect(element).toMatchSnapshot()

      element = renderer.render(
        <ResetPasswordEnterPassword
          {...props}
          form={{ pristine: false, valid: true, submitting: true }}
        />
      )
      expect(element).toMatchSnapshot()
    })

    it('should enable the submit button when the form is dirty, valid and not submitting', () => {
      const element = renderer.render(
        <ResetPasswordEnterPassword
          {...props}
          form={{ pristine: false, valid: true, submitting: false }}
        />
      )
      expect(element).toMatchSnapshot()
    })
  })

  describe('validate function', () => {
    it('should validate required email address', () => {
      expect(
        validate({ newPassword: '', confirmNewPassword: '' }, props)
      ).toMatchSnapshot()
    })

    it('should validate that the email address is valid', () => {
      expect(
        validate({ newPassword: 'test', confirmNewPassword: '' }, props)
      ).toMatchSnapshot()
      expect(
        validate({ newPassword: 'testabcd', confirmNewPassword: '' }, props)
      ).toMatchSnapshot()
      expect(
        validate({ newPassword: 'testabc1', confirmNewPassword: '' }, props)
      ).toMatchSnapshot()
    })

    it('should validate confirm password is equal to password', () => {
      expect(
        validate({ newPassword: 'testab1$', confirmNewPassword: '' }, props)
      ).toMatchSnapshot()
      expect(
        validate(
          { newPassword: 'testab1$', confirmNewPassword: 'testab1$' },
          props
        )
      ).toMatchSnapshot()
    })
  })
})
