import React from 'react'
import { assert } from 'chai'
import { shallow } from 'enzyme'
import proxyquire from 'proxyquire'
import Immutable from 'immutable'
import sinon from 'sinon'
import TextInput from '../../components/shared/TextInput'
import StrongPasswordInput from '../../components/shared/StrongPasswordInput'
import RaisedButton from 'material-ui/RaisedButton'
import {Link} from 'react-router'
import FlatButton from 'material-ui/FlatButton'

describe('Reset Password Enter Password Form', () => {
  const fakeReactIntl = {
    injectIntl: component => component,
    defineMessages: messages => messages
  }

  describe('ResetPasswordEnterPassword component', () => {
    const fakeReduxForm = {
        reduxForm: () => component => component
      }, ResetPasswordEnterPassword = proxyquire('./ResetPasswordEnterPassword', {
        'redux-form/immutable': fakeReduxForm,
        'react-intl': fakeReactIntl,
        './messages': proxyquire('./messages', {
          'react-intl': fakeReactIntl
        }).default
      }).default

    let props, ResetPasswordEnterPasswordWrapper

    const shallowRenderResetPasswordEnterPassword = () => {
      ResetPasswordEnterPasswordWrapper = shallow(<ResetPasswordEnterPassword {...props} />)
    }

    beforeEach(() => {
      props = {
        pristine: true,
        invalid: true,
        initialValues: {
          newPassword: null,
          confirmNewPassword: null
        },
        handleSubmit: () => { },
        intl: {
          formatMessage: message => message.defaultMessage
        }
      }
      shallowRenderResetPasswordEnterPassword(props)
    })

    it('Should be a form', () => {
      assert.equal(ResetPasswordEnterPasswordWrapper.node.type, 'form')
      assert.equal(ResetPasswordEnterPasswordWrapper.find('form').props().onSubmit, props.handleSubmit)
    })

    it('Should render a message', () => {
      assert.equal(ResetPasswordEnterPasswordWrapper.find('p').text(), 'Please enter your new password?')
    })

    it('Should contain fields to enter and confirm a password', () => {
      assert.deepEqual(ResetPasswordEnterPasswordWrapper.find(StrongPasswordInput).props(), {
        name: 'newPassword',
        label: 'New Password',
        maxLength: '100',
        autoFocus: true,
        requiresNumber: true,
        requiresSpecialCharacter: true,
        minLength: 8,
        fullWidth: true
      })
      assert.deepEqual(ResetPasswordEnterPasswordWrapper.find(TextInput).props(), {
        name: 'confirmNewPassword',
        label: 'Confirm New Password',
        maxLength: '100',
        type: 'password',
        fullWidth: true
      })
    })

    it('Should contain a submit button', () => {
      assert.deepEqual(ResetPasswordEnterPasswordWrapper.find(RaisedButton).props(), {
        disabled: true,
        label: 'Next',
        primary: true,
        type: 'submit',
        fullWidth: false,
        labelPosition: 'after',
        secondary: false
      })
    })

    it('Should contain a cancel button', () => {
      const cancelLink = ResetPasswordEnterPasswordWrapper.find(Link)
      assert.equal(cancelLink.props().to, 'login')
      assert.equal(cancelLink.props().children.type, FlatButton)
      const cancelButton = cancelLink.props().children
      assert.deepEqual(cancelButton.props, {
        ...cancelButton.props,
        disabled: false,
        label: 'Cancel',
        secondary: true
      })
    })

    it('Should enable the submit button when the form is dirty, valid and not submitting', () => {
      let submitButton = ResetPasswordEnterPasswordWrapper.find(RaisedButton)
      assert.isTrue(submitButton.props().disabled)

      props.pristine = false
      shallowRenderResetPasswordEnterPassword(props)
      submitButton = ResetPasswordEnterPasswordWrapper.find(RaisedButton)
      assert.isTrue(submitButton.props().disabled)

      props.invalid = false
      shallowRenderResetPasswordEnterPassword(props)
      submitButton = ResetPasswordEnterPasswordWrapper.find(RaisedButton)
      assert.isFalse(submitButton.props().disabled)

      props.pristine = true
      shallowRenderResetPasswordEnterPassword(props)
      submitButton = ResetPasswordEnterPasswordWrapper.find(RaisedButton)
      assert.isTrue(submitButton.props().disabled)
    })
  })

  describe('reduxForm', () => {
    let reduxFormStub, reduxFormConfig

    beforeEach(() => {
      reduxFormStub = {
        reduxForm: sinon.stub().returns(() => {})
      }
      proxyquire('./ResetPasswordEnterPassword', {
        'redux-form/immutable': reduxFormStub,
        'react-intl': fakeReactIntl
      })
      reduxFormConfig = reduxFormStub.reduxForm.firstCall.args[0]
    })

    it('Should create a form called \'resetPasswordEnterNewPassword\'', () => {
      assert.equal(reduxFormConfig.form, 'resetPasswordEnterNewPassword')
    })

    describe('validate function', () => {
      const props = {
        intl: {
          formatMessage: message => message.defaultMessage
        }
      }
      let validateFunction, initialPasswordFields

      beforeEach(() => {
        validateFunction = reduxFormConfig.validate
        initialPasswordFields = Immutable.Map({
          newPassword: '',
          confirmNewPassword: ''
        })
      })

      it('Should validate required password', () => {
        assert.deepEqual(validateFunction(initialPasswordFields, props), {
          newPassword: 'Please enter a new password'
        })
      })

      it('Should validate that the new password is valid', () => {
        let passwordFields = initialPasswordFields.set('newPassword', 'test')
        assert.deepEqual(validateFunction(passwordFields, props), {
          newPassword: 'Your password needs to be at least 8 characters long',
          confirmNewPassword: 'These passwords don\'t match'
        })

        passwordFields = initialPasswordFields.set('newPassword', 'testabcd')
        assert.deepEqual(validateFunction(passwordFields, props), {
          newPassword: 'Your password needs to contain at least one number',
          confirmNewPassword: 'These passwords don\'t match'
        })

        passwordFields = initialPasswordFields.set('newPassword', 'testabc1')
        assert.deepEqual(validateFunction(passwordFields, props), {
          newPassword: 'Your password needs to contain a special character (%!$*...)',
          confirmNewPassword: 'These passwords don\'t match'
        })

        passwordFields = initialPasswordFields.set('newPassword', 'testab1$')
        assert.deepEqual(validateFunction(passwordFields, props), {
          confirmNewPassword: 'These passwords don\'t match'
        })
      })

      it('Should validate confirm password is equal to password', () => {
        let passwordFields = initialPasswordFields.set('newPassword', 'testab1$')
        assert.deepEqual(validateFunction(passwordFields, props), {
          confirmNewPassword: 'These passwords don\'t match'
        })

        passwordFields = passwordFields.set('confirmNewPassword', 'testab1$')
        assert.deepEqual(validateFunction(passwordFields, props), { })
      })
    })
  })
})
