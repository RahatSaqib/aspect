import React from 'react'
import { assert } from 'chai'
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
        onSubmit: () => {},
        intl: {
          formatMessage: message => message.defaultMessage
        }
      }
      shallowRenderForm(props)
    })

    it('Should be a form', () => {
      assert.equal(LoginDetailsFormWrapper.node.type, 'form')
      assert.equal(LoginDetailsFormWrapper.find('form').props().onSubmit, props.handleSubmit)
    })

    it('Should contain fields for username and password', () => {
      assert.deepEqual(LoginDetailsFormWrapper.find(TextInput).at(0).props(), {
        name: 'username',
        label: 'Username',
        disabled: props.loading,
        maxLength: '255'
      })
      assert.deepEqual(LoginDetailsFormWrapper.find(StrongPasswordInput).props(), {
        name: 'newPassword',
        label: 'New Password',
        disabled: props.loading,
        maxLength: '100',
        anchorOrigin: { horizontal: 'right', vertical: 'top' },
        targetOrigin: { horizontal: 'left', vertical: 'center' }
      })
      assert.deepEqual(LoginDetailsFormWrapper.find(TextInput).at(1).props(), {
        name: 'confirmNewPassword',
        label: 'Confirm New Password',
        disabled: props.loading,
        maxLength: '100',
        type: 'password'
      })
    })

    it('Should disable all fields when form is loading', () => {
      LoginDetailsFormWrapper.find(TextInput).forEach((textInput) => {
        assert.isFalse(textInput.props().disabled)
      })
      LoginDetailsFormWrapper.find(StrongPasswordInput).forEach((strongPasswordInput) => {
        assert.isFalse(strongPasswordInput.props().disabled)
      })
      props.loading = true
      shallowRenderForm(props)
      LoginDetailsFormWrapper.find(TextInput).forEach((textInput) => {
        assert.isTrue(textInput.props().disabled)
      })
      LoginDetailsFormWrapper.find(StrongPasswordInput).forEach((strongPasswordInput) => {
        assert.isTrue(strongPasswordInput.props().disabled)
      })
    })

    it('Should contain a submit button', () => {
      const submitButton = LoginDetailsFormWrapper.find(RaisedButton)
      assert.equal(submitButton.length, 1)
      assert.deepEqual(submitButton.props(), {
        ...submitButton.props(),
        label: 'Save',
        secondary: true,
        disabled: props.loading || props.invalid || props.pristine
      })
    })

    it('Should enable the submit button when the form is dirty, valid and not submitting', () => {
      let submitButton = LoginDetailsFormWrapper.find(RaisedButton)
      assert.isTrue(submitButton.props().disabled)

      props.pristine = false
      shallowRenderForm(props)
      submitButton = LoginDetailsFormWrapper.find(RaisedButton)
      assert.isTrue(submitButton.props().disabled)

      props.invalid = false
      shallowRenderForm(props)
      submitButton = LoginDetailsFormWrapper.find(RaisedButton)
      assert.isFalse(submitButton.props().disabled)

      props.pristine = true
      shallowRenderForm(props)
      submitButton = LoginDetailsFormWrapper.find(RaisedButton)
      assert.isTrue(submitButton.props().disabled)
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
      assert.equal(reduxFormConfig.form, 'loginDetails')
    })

    describe('validate function', () => {
      const props = {
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
        assert.deepEqual(validateFunction(initialLoginDetails, props), {
          currentPassword: 'Please enter your current password to update your login details'
        })
        const loginDetails = initialLoginDetails.set('username', '')
        assert.deepEqual(validateFunction(loginDetails, props), {
          currentPassword: 'Please enter your current password to update your login details',
          username: 'A username is required'
        })
      })

      it('should validate password if it has been entered', () => {
        let loginDetails = initialLoginDetails.set('newPassword', 'invalid')
        assert.deepEqual(validateFunction(loginDetails, props), {
          currentPassword: 'Please enter your current password to update your login details',
          newPassword: 'The password needs to be at least 8 characters long',
          confirmNewPassword: 'These passwords don\'t match'
        })

        loginDetails = initialLoginDetails.merge({
          newPassword: 'lessInvalid',
          confirmNewPassword: 'lessInvalid'
        })
        assert.deepEqual(validateFunction(loginDetails, props), {
          currentPassword: 'Please enter your current password to update your login details',
          newPassword: 'The password needs to contain at least one number or special character (%!$*...)'
        })

        loginDetails = initialLoginDetails.set('newPassword', 'valid123')
        assert.deepEqual(validateFunction(loginDetails, props), {
          currentPassword: 'Please enter your current password to update your login details',
          confirmNewPassword: 'These passwords don\'t match'
        })

        loginDetails = initialLoginDetails.set('confirmNewPassword', 'valid123')
        assert.deepEqual(validateFunction(loginDetails, props), {
          currentPassword: 'Please enter your current password to update your login details'
        })
      })

      it('should be able to handle an undefined parameter', () => {
        assert.deepEqual(validateFunction(undefined, props), {})
      })
    })
  })
})
