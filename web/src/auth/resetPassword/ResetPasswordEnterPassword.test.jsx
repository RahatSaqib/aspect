import React from 'react'
import { shallow } from 'enzyme'
import Immutable from 'immutable'
import { Link } from 'react-router-dom'
import RaisedButton from 'material-ui/RaisedButton'
import FlatButton from 'material-ui/FlatButton'
import TextInput from '../../components/shared/TextInput'
import StrongPasswordInput from '../../components/shared/StrongPasswordInput'

describe('ResetPasswordEnterPassword module', () => {
  const {
    ResetPasswordEnterPassword,
    validate,
  } = require('./ResetPasswordEnterPassword')

  describe('ResetPasswordEnterPassword component', () => {
    let props
    let ResetPasswordEnterPasswordWrapper

    const shallowRenderResetPasswordEnterPassword = () => {
      ResetPasswordEnterPasswordWrapper = shallow(
        <ResetPasswordEnterPassword {...props} />
      )
    }

    beforeEach(() => {
      props = {
        pristine: true,
        invalid: true,
        initialValues: {
          newPassword: null,
          confirmNewPassword: null,
        },
        handleSubmit: () => {},
        intl: {
          formatMessage: message => message.defaultMessage,
        },
      }
      shallowRenderResetPasswordEnterPassword(props)
    })

    it('Should be a form', () => {
      expect(ResetPasswordEnterPasswordWrapper.node.type).toEqual('form')
      expect(
        ResetPasswordEnterPasswordWrapper.find('form').props().onSubmit
      ).toEqual(props.handleSubmit)
    })

    it('Should render a message', () => {
      expect(ResetPasswordEnterPasswordWrapper.find('p').text()).toEqual(
        'Please enter your new password?'
      )
    })

    it('Should contain fields to enter and confirm a password', () => {
      expect(
        ResetPasswordEnterPasswordWrapper.find(StrongPasswordInput).props()
      ).toEqual({
        name: 'newPassword',
        label: 'New Password',
        maxLength: '100',
        autoFocus: true,
        fullWidth: true,
      })
      expect(
        ResetPasswordEnterPasswordWrapper.find(TextInput).props()
      ).toEqual({
        name: 'confirmNewPassword',
        label: 'Confirm New Password',
        maxLength: '100',
        type: 'password',
        fullWidth: true,
      })
    })

    it('Should contain a submit button', () => {
      expect(
        ResetPasswordEnterPasswordWrapper.find(RaisedButton).props()
      ).toEqual({
        disabled: true,
        label: 'Next',
        primary: true,
        type: 'submit',
        fullWidth: false,
        labelPosition: 'after',
        secondary: false,
      })
    })

    it('Should contain a cancel button', () => {
      const cancelLink = ResetPasswordEnterPasswordWrapper.find(Link)
      expect(cancelLink.props().to).toEqual('login')
      expect(cancelLink.props().children.type).toEqual(FlatButton)
      const cancelButton = cancelLink.props().children
      expect(cancelButton.props).toEqual({
        ...cancelButton.props,
        disabled: false,
        label: 'Cancel',
        secondary: true,
      })
    })

    it('Should enable the submit button when the form is dirty, valid and not submitting', () => {
      let submitButton = ResetPasswordEnterPasswordWrapper.find(RaisedButton)
      expect(submitButton.props().disabled).toBe(true)

      props.pristine = false
      shallowRenderResetPasswordEnterPassword(props)
      submitButton = ResetPasswordEnterPasswordWrapper.find(RaisedButton)
      expect(submitButton.props().disabled).toBe(true)

      props.invalid = false
      shallowRenderResetPasswordEnterPassword(props)
      submitButton = ResetPasswordEnterPasswordWrapper.find(RaisedButton)
      expect(submitButton.props().disabled).toBe(false)

      props.pristine = true
      shallowRenderResetPasswordEnterPassword(props)
      submitButton = ResetPasswordEnterPasswordWrapper.find(RaisedButton)
      expect(submitButton.props().disabled).toBe(true)
    })
  })

  describe('validate function', () => {
    const props = {
      intl: {
        formatMessage: message => message.defaultMessage,
      },
    }
    let initialPasswordFields

    beforeEach(() => {
      initialPasswordFields = Immutable.Map({
        newPassword: '',
        confirmNewPassword: '',
      })
    })

    it('Should validate required password', () => {
      expect(validate(initialPasswordFields, props)).toEqual({
        newPassword: 'Please enter a new password',
      })
    })

    it('Should validate that the new password is valid', () => {
      let passwordFields = initialPasswordFields.set('newPassword', 'test')
      expect(validate(passwordFields, props)).toEqual({
        newPassword: 'Your password needs to be at least 8 characters long',
        confirmNewPassword: "These passwords don't match",
      })

      passwordFields = initialPasswordFields.set('newPassword', 'testabcd')
      expect(validate(passwordFields, props)).toEqual({
        newPassword:
          'Your password needs to contain at least one number or special character (%!$*...)',
        confirmNewPassword: "These passwords don't match",
      })

      passwordFields = initialPasswordFields.set('newPassword', 'testabc1')
      expect(validate(passwordFields, props)).toEqual({
        confirmNewPassword: "These passwords don't match",
      })
    })

    it('Should validate confirm password is equal to password', () => {
      let passwordFields = initialPasswordFields.set('newPassword', 'testab1$')
      expect(validate(passwordFields, props)).toEqual({
        confirmNewPassword: "These passwords don't match",
      })

      passwordFields = passwordFields.set('confirmNewPassword', 'testab1$')
      expect(validate(passwordFields, props)).toEqual({})
    })
  })
})
