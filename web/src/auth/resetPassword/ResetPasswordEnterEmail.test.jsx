import _ from 'lodash'
import React from 'react'
import renderer from 'react-test-renderer'

import { validate, ResetPasswordEnterEmail } from './ResetPasswordEnterEmail'

describe('ResetPasswordEnterEmail module', () => {
  const props = {
    intl: { formatMessage: message => message.defaultMessage },
    onShowAdminHelpDialog: _.noop,
    values: {},
    meta: {
      emailAddress: {},
    },
    onEmailAddressChange: _.noop,
    handleSubmit: _.noop,
  }

  describe('ResetPasswordEnterEmail component', () => {
    it('should render correctly', () => {
      const component = renderer.create(
        <ResetPasswordEnterEmail {...props} form={{}} />
      )
      const tree = component.toJSON()
      expect(tree).toMatchSnapshot()
    })

    it('should enable the submit button when the form is dirty, valid and not submitting', () => {
      const component = renderer.create(
        <ResetPasswordEnterEmail
          {...props}
          form={{ pristine: false, valide: true, submitting: false }}
        />
      )
      const tree = component.toJSON()
      expect(tree).toMatchSnapshot()
    })
  })

  describe('validate function', () => {
    it('should validate required email address', () => {
      expect(validate({ emailAddress: '' }, props)).toMatchSnapshot()
    })

    it('should validate that the email address is valid', () => {
      expect(validate({ emailAddress: 'test' }, props)).toMatchSnapshot()
      expect(
        validate({ emailAddress: 'test@example' }, props)
      ).toMatchSnapshot()
      expect(
        validate({ emailAddress: 'test@example.com' }, props)
      ).toMatchSnapshot()
    })
  })
})
