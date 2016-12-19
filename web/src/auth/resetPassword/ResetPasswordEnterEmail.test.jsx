import React from 'react'
import { shallow } from 'enzyme'
import Immutable from 'immutable'
import sinon from 'sinon'
import RaisedButton from 'material-ui/RaisedButton'
import { Link } from 'react-router'
import FlatButton from 'material-ui/FlatButton'
import TextInput from '../../components/shared/TextInput'

describe('ResetPasswordEnterEmail module', () => {
  const {
    ResetPasswordEnterEmail,
    validate
  } = require('./ResetPasswordEnterEmail')

  describe('ResetPasswordEnterEmail component', () => {
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
      expect(ResetPasswordEnterEmailWrapper.node.type).toEqual('form')
      expect(ResetPasswordEnterEmailWrapper.find('form').props().onSubmit).toEqual(props.handleSubmit)
    })

    it('Should render a message', () => {
      expect(ResetPasswordEnterEmailWrapper.find('p').text()).toEqual('Please enter the email address that you are registered with')
    })

    it('Should contain a field to enter an email address', () => {
      expect(ResetPasswordEnterEmailWrapper.find(TextInput).props()).toEqual({
        autoFocus: true,
        name: 'emailAddress',
        label: 'Email Address',
        maxLength: '500',
        fullWidth: true
      })
    })

    it('Should contain a link that calls the showAdminHelpDialog function when clicked', () => {
      const anchorTag = ResetPasswordEnterEmailWrapper.find('a')
      expect(anchorTag.props()).toEqual({
        children: 'I don\'t know what email address I am registered with',
        href: '#showAdminHelp',
        onClick: props.showAdminHelpDialog
      })
      expect(props.showAdminHelpDialog.notCalled).toBe(true)
      anchorTag.simulate('click')
      expect(props.showAdminHelpDialog.calledOnce).toBe(true)
    })

    it('Should contain a submit button', () => {
      expect(ResetPasswordEnterEmailWrapper.find(RaisedButton).props()).toEqual({
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
      expect(cancelLink.props().to).toEqual('login')
      expect(cancelLink.props().children.type).toEqual(FlatButton)
      const cancelButton = cancelLink.props().children
      expect(cancelButton.props).toEqual({
        ...cancelButton.props,
        disabled: false,
        label: 'Cancel',
        secondary: true
      })
    })

    it('Should enable the submit button when the form is dirty, valid and not submitting', () => {
      let submitButton = ResetPasswordEnterEmailWrapper.find(RaisedButton)
      expect(submitButton.props().disabled).toBe(true)

      props.pristine = false
      shallowRenderResetPasswordEnterEmail(props)
      submitButton = ResetPasswordEnterEmailWrapper.find(RaisedButton)
      expect(submitButton.props().disabled).toBe(true)

      props.invalid = false
      shallowRenderResetPasswordEnterEmail(props)
      submitButton = ResetPasswordEnterEmailWrapper.find(RaisedButton)
      expect(submitButton.props().disabled).toBe(false)

      props.pristine = true
      shallowRenderResetPasswordEnterEmail(props)
      submitButton = ResetPasswordEnterEmailWrapper.find(RaisedButton)
      expect(submitButton.props().disabled).toBe(true)
    })
  })

  describe('validate function', () => {
    const props = {
      intl: {
        formatMessage: message => message.defaultMessage
      }
    }
    let initialEmailField

    beforeEach(() => {
      initialEmailField = Immutable.Map({
        emailAddress: ''
      })
    })

    it('Should validate required email address', () => {
      expect(validate(initialEmailField, props)).toEqual({
        emailAddress: 'Please enter a valid email address'
      })
    })

    it('Should validate that the email address is valid', () => {
      let emailField = initialEmailField.set('emailAddress', 'test')
      expect(validate(emailField, props)).toEqual({
        emailAddress: 'Please enter a valid email address'
      })

      emailField = initialEmailField.set('emailAddress', 'test@example')
      expect(validate(emailField, props)).toEqual({
        emailAddress: 'Please enter a valid email address'
      })

      emailField = initialEmailField.set('emailAddress', 'test@example.com')
      expect(validate(emailField, props)).toEqual({ })
    })
  })
})
