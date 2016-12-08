import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import Immutable from 'immutable'
import RaisedButton from 'material-ui/RaisedButton'
import TextInput from '../../components/shared/TextInput'
import StrongPasswordInput from '../../components/shared/StrongPasswordInput'

describe('LoginDetailsForm Component', () => {
  const fakeReactIntl = {
    injectIntl: component => component
  }

  describe('ContactDetailsForm', () => {
    const fakeReduxForm = {
      reduxForm: () => component => component
    }
    const LoginDetailsForm = proxyquire('./LoginDetailsForm', {
      'redux-form/immutable': fakeReduxForm,
      'react-intl': fakeReactIntl
    }).default

    let props
    let LoginDetailsFormWrapper

    const shallowRenderForm = (props) => {
      LoginDetailsFormWrapper = shallow(<LoginDetailsForm {...props} />)
    }

    beforeEach(() => {
      props = {
        pristine: true,
        invalid: true,
        loading: false,
        initialValues: { },
        handleSubmit: () => {},
        intl: {
          formatMessage: message => message.defaultMessage
        }
      }
      shallowRenderForm(props)
    })

    it('Should be a form', () => {
      expect(LoginDetailsFormWrapper.node.type).toEqual('form')
      expect(LoginDetailsFormWrapper.find('form').props().onSubmit).toEqual(props.handleSubmit)
    })

    it('Should contain fields for username and password', () => {
      expect(LoginDetailsFormWrapper.find(TextInput).at(0).props()).toEqual({
        name: 'username',
        label: 'Username',
        disabled: props.loading,
        maxLength: '255'
      })
      expect(LoginDetailsFormWrapper.find(StrongPasswordInput).props()).toEqual({
        name: 'newPassword',
        label: 'New Password',
        disabled: props.loading,
        maxLength: '100',
        anchorOrigin: { horizontal: 'right', vertical: 'top' },
        targetOrigin: { horizontal: 'left', vertical: 'center' }
      })
      expect(LoginDetailsFormWrapper.find(TextInput).at(1).props()).toEqual({
        name: 'confirmNewPassword',
        label: 'Confirm New Password',
        disabled: props.loading,
        maxLength: '100',
        type: 'password'
      })
    })

    it('Should disable all fields when form is loading', () => {
      LoginDetailsFormWrapper.find(TextInput).forEach((textInput) => {
        expect(textInput.props().disabled).toBe(false)
      })
      LoginDetailsFormWrapper.find(StrongPasswordInput).forEach((strongPasswordInput) => {
        expect(strongPasswordInput.props().disabled).toBe(false)
      })
      props.loading = true
      shallowRenderForm(props)
      LoginDetailsFormWrapper.find(TextInput).forEach((textInput) => {
        expect(textInput.props().disabled).toBe(true)
      })
      LoginDetailsFormWrapper.find(StrongPasswordInput).forEach((strongPasswordInput) => {
        expect(strongPasswordInput.props().disabled).toBe(true)
      })
    })

    it('Should contain a submit button', () => {
      const submitButton = LoginDetailsFormWrapper.find(RaisedButton)
      expect(submitButton.length).toEqual(1)
      expect(submitButton.props()).toEqual({
        ...submitButton.props(),
        label: 'Save',
        secondary: true,
        disabled: props.loading || props.invalid || props.pristine
      })
    })

    it('Should enable the submit button when the form is dirty, valid and not submitting', () => {
      let submitButton = LoginDetailsFormWrapper.find(RaisedButton)
      expect(submitButton.props().disabled).toBe(true)

      props.pristine = false
      shallowRenderForm(props)
      submitButton = LoginDetailsFormWrapper.find(RaisedButton)
      expect(submitButton.props().disabled).toBe(true)

      props.invalid = false
      shallowRenderForm(props)
      submitButton = LoginDetailsFormWrapper.find(RaisedButton)
      expect(submitButton.props().disabled).toBe(false)

      props.pristine = true
      shallowRenderForm(props)
      submitButton = LoginDetailsFormWrapper.find(RaisedButton)
      expect(submitButton.props().disabled).toBe(true)
    })
  })

  describe('reduxForm', () => {
    let reduxFormStub
    let reduxFormConfig

    beforeEach(() => {
      reduxFormStub = {
        reduxForm: sinon.stub().returns(() => {})
      }
      proxyquire('./LoginDetailsForm', {
        'redux-form/immutable': reduxFormStub,
        'react-intl': fakeReactIntl
      })
      reduxFormConfig = reduxFormStub.reduxForm.firstCall.args[0]
    })

    it('Should create a form called \'loginDetails\'', () => {
      expect(reduxFormConfig.form).toEqual('loginDetails')
    })

    describe('validate function', () => {
      const props = {
        handleSubmit: () => {},
        intl: {
          formatMessage: message => message.defaultMessage
        }
      }
      let validateFunction
      let initialLoginDetails

      beforeEach(() => {
        validateFunction = reduxFormConfig.validate
        initialLoginDetails = Immutable.Map({
          username: 'admin',
          newPassword: null,
          confirmNewPassword: null
        })
      })

      it('should validate that a username has been entered', () => {
        expect(validateFunction(initialLoginDetails, props)).toEqual({
          currentPassword: 'Please enter your current password to update your login details'
        })
        const loginDetails = initialLoginDetails.set('username', '')
        expect(validateFunction(loginDetails, props)).toEqual({
          currentPassword: 'Please enter your current password to update your login details',
          username: 'A username is required'
        })
      })

      it('should validate password if it has been entered', () => {
        let loginDetails = initialLoginDetails.set('newPassword', 'invalid')
        expect(validateFunction(loginDetails, props)).toEqual({
          currentPassword: 'Please enter your current password to update your login details',
          newPassword: 'The password needs to be at least 8 characters long',
          confirmNewPassword: 'These passwords don\'t match'
        })

        loginDetails = initialLoginDetails.merge({
          newPassword: 'lessInvalid',
          confirmNewPassword: 'lessInvalid'
        })
        expect(validateFunction(loginDetails, props)).toEqual({
          currentPassword: 'Please enter your current password to update your login details',
          newPassword: 'The password needs to contain at least one number or special character (%!$*...)'
        })

        loginDetails = initialLoginDetails.set('newPassword', 'valid123')
        expect(validateFunction(loginDetails, props)).toEqual({
          currentPassword: 'Please enter your current password to update your login details',
          confirmNewPassword: 'These passwords don\'t match'
        })

        loginDetails = initialLoginDetails.set('confirmNewPassword', 'valid123')
        expect(validateFunction(loginDetails, props)).toEqual({
          currentPassword: 'Please enter your current password to update your login details'
        })
      })

      it('should be able to handle an undefined parameter', () => {
        expect(validateFunction(undefined, props)).toEqual({})
      })
    })
  })
})
