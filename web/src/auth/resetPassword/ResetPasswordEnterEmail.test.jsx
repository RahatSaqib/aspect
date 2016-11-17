import React from 'react'
import { assert } from 'chai'
import { shallow } from 'enzyme'
import proxyquire from 'proxyquire'
import Immutable from 'immutable'
import sinon from 'sinon'
import RaisedButton from 'material-ui/RaisedButton'
import { Link } from 'react-router'
import FlatButton from 'material-ui/FlatButton'
import TextInput from '../../components/shared/TextInput'

describe('Reset Password Enter Email Form', () => {
  const fakeReactIntl = {
    injectIntl: component => component,
    defineMessages: messages => messages
  }

  describe('ResetPasswordEnterEmail component', () => {
    const fakeReduxForm = {
      reduxForm: () => component => component
    }
    const ResetPasswordEnterEmail = proxyquire('./ResetPasswordEnterEmail', {
      'redux-form/immutable': fakeReduxForm,
      'react-intl': fakeReactIntl,
      './messages': proxyquire('./messages', {
        'react-intl': fakeReactIntl
      }).default
    }).default

    let props
    let ResetPasswordEnterEmailWrapper

    const shallowRenderResetPasswordEnterEmail = () => {
      ResetPasswordEnterEmailWrapper = shallow(<ResetPasswordEnterEmail {...props} />)
    }

    beforeEach(() => {
      props = {
        pristine: true,
        invalid: true,
        initialValues: {
          emailAddress: null
        },
        handleSubmit: () => { },
        intl: {
          formatMessage: message => message.defaultMessage
        },
        showAdminHelpDialog: sinon.spy()
      }
      shallowRenderResetPasswordEnterEmail(props)
    })

    it('Should be a form', () => {
      assert.equal(ResetPasswordEnterEmailWrapper.node.type, 'form')
      assert.equal(ResetPasswordEnterEmailWrapper.find('form').props().onSubmit, props.handleSubmit)
    })

    it('Should render a message', () => {
      assert.equal(ResetPasswordEnterEmailWrapper.find('p').text(), 'Please enter the email address that you are registered with')
    })

    it('Should contain a field to enter an email address', () => {
      assert.deepEqual(ResetPasswordEnterEmailWrapper.find(TextInput).props(), {
        autoFocus: true,
        name: 'emailAddress',
        label: 'Email Address',
        maxLength: '500',
        fullWidth: true
      })
    })

    it('Should contain a link that calls the showAdminHelpDialog function when clicked', () => {
      const anchorTag = ResetPasswordEnterEmailWrapper.find('a')
      assert.deepEqual(anchorTag.props(), {
        children: 'I don\'t know what email address I am registered with',
        href: '#showAdminHelp',
        onClick: props.showAdminHelpDialog
      })
      assert.isTrue(props.showAdminHelpDialog.notCalled)
      anchorTag.simulate('click')
      assert.isTrue(props.showAdminHelpDialog.calledOnce)
    })

    it('Should contain a submit button', () => {
      assert.deepEqual(ResetPasswordEnterEmailWrapper.find(RaisedButton).props(), {
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
      const cancelLink = ResetPasswordEnterEmailWrapper.find(Link)
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
      let submitButton = ResetPasswordEnterEmailWrapper.find(RaisedButton)
      assert.isTrue(submitButton.props().disabled)

      props.pristine = false
      shallowRenderResetPasswordEnterEmail(props)
      submitButton = ResetPasswordEnterEmailWrapper.find(RaisedButton)
      assert.isTrue(submitButton.props().disabled)

      props.invalid = false
      shallowRenderResetPasswordEnterEmail(props)
      submitButton = ResetPasswordEnterEmailWrapper.find(RaisedButton)
      assert.isFalse(submitButton.props().disabled)

      props.pristine = true
      shallowRenderResetPasswordEnterEmail(props)
      submitButton = ResetPasswordEnterEmailWrapper.find(RaisedButton)
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
      proxyquire('./ResetPasswordEnterEmail', {
        'redux-form/immutable': reduxFormStub,
        'react-intl': fakeReactIntl
      })
      reduxFormConfig = reduxFormStub.reduxForm.firstCall.args[0]
    })

    it('Should create a form called \'resetPasswordEnterEmail\'', () => {
      assert.equal(reduxFormConfig.form, 'resetPasswordEnterEmail')
    })

    describe('validate function', () => {
      const props = {
        intl: {
          formatMessage: message => message.defaultMessage
        }
      }
      let validateFunction
      let initialEmailField

      beforeEach(() => {
        validateFunction = reduxFormConfig.validate
        initialEmailField = Immutable.Map({
          emailAddress: ''
        })
      })

      it('Should validate required email address', () => {
        assert.deepEqual(validateFunction(initialEmailField, props), {
          emailAddress: 'Please enter a valid email address'
        })
      })

      it('Should validate that the email address is valid', () => {
        let emailField = initialEmailField.set('emailAddress', 'test')
        assert.deepEqual(validateFunction(emailField, props), {
          emailAddress: 'Please enter a valid email address'
        })

        emailField = initialEmailField.set('emailAddress', 'test@example')
        assert.deepEqual(validateFunction(emailField, props), {
          emailAddress: 'Please enter a valid email address'
        })

        emailField = initialEmailField.set('emailAddress', 'test@example.com')
        assert.deepEqual(validateFunction(emailField, props), { })
      })
    })
  })
})
