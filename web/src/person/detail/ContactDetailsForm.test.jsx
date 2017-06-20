import React from 'react'
import { shallow } from 'enzyme'
import Immutable from 'immutable'
import RaisedButton from 'material-ui/RaisedButton'
import TextInput from '../../components/shared/TextInput'
import PhoneInput from '../../components/shared/PhoneInput'
import LocationSelector from '../../components/shared/LocationSelector'

describe('ContactDetailsForm module', () => {
  const { validate, ContactDetailsForm } = require('./ContactDetailsForm')

  describe('ContactDetailsForm component', () => {
    let props
    let ContactDetailsFormWrapper

    const shallowRenderForm = props => {
      ContactDetailsFormWrapper = shallow(<ContactDetailsForm {...props} />)
    }

    beforeEach(() => {
      props = {
        pristine: true,
        invalid: true,
        loading: false,
        initialValues: {
          countryId: null,
          stateId: null,
        },
        handleSubmit: () => {},
        intl: {
          formatMessage: message => message.defaultMessage,
        },
      }
      shallowRenderForm(props)
    })

    it('Should be a form', () => {
      expect(ContactDetailsFormWrapper.node.type).toEqual('form')
      expect(ContactDetailsFormWrapper.find('form').props().onSubmit).toEqual(
        props.handleSubmit
      )
    })

    it('Should contain fields for all contact details', () => {
      const expectedTextFieldLabels = {
        name: 'Full Name',
        title: 'Job Title',
        email: 'Primary',
        email2: 'Alternate',
        zip: 'Zip Code',
      }
      const expectedPhoneFieldLabels = {
        phone: 'Telephone',
        cell: 'Mobile',
      }
      const textInputs = ContactDetailsFormWrapper.find(TextInput)
      const phoneInputs = ContactDetailsFormWrapper.find(PhoneInput)

      expect(textInputs.length).toEqual(
        Object.keys(expectedTextFieldLabels).length
      )
      textInputs.forEach(textInput => {
        expect(textInput.props().label).toEqual(
          expectedTextFieldLabels[textInput.props().name]
        )
      })
      phoneInputs.forEach(phoneInput => {
        expect(phoneInput.props().label).toEqual(
          expectedPhoneFieldLabels[phoneInput.props().name]
        )
      })
    })

    it('Should disable all fields when form is loading', () => {
      ContactDetailsFormWrapper.find(TextInput).forEach(textInput => {
        expect(textInput.props().disabled).toBe(false)
      })
      props.loading = true
      shallowRenderForm(props)
      ContactDetailsFormWrapper.find(TextInput).forEach(textInput => {
        expect(textInput.props().disabled).toBe(true)
      })
    })

    it('Should contain a location selector', () => {
      const locationSelector = ContactDetailsFormWrapper.find(LocationSelector)
      expect(locationSelector.length).toEqual(1)
      expect(locationSelector.props()).toEqual({
        initialValues: props.initialValues,
        formName: 'accountDetails',
        countryIdFieldName: 'countryId',
        stateIdFieldName: 'stateId',
        lgaIdFieldName: 'lgaId',
        loading: props.loading,
      })
    })

    it('Should contain a submit button', () => {
      const submitButton = ContactDetailsFormWrapper.find(RaisedButton)
      expect(submitButton.length).toEqual(1)
      expect(submitButton.props()).toEqual({
        ...submitButton.props(),
        label: 'Save',
        secondary: true,
        type: 'submit',
        disabled: props.loading || props.invalid || props.pristine,
      })
    })

    it('Should enable the submit button when the form is dirty, valid and not submitting', () => {
      let submitButton = ContactDetailsFormWrapper.find(RaisedButton)
      expect(submitButton.props().disabled).toBe(true)

      props.pristine = false
      shallowRenderForm(props)
      submitButton = ContactDetailsFormWrapper.find(RaisedButton)
      expect(submitButton.props().disabled).toBe(true)

      props.invalid = false
      shallowRenderForm(props)
      submitButton = ContactDetailsFormWrapper.find(RaisedButton)
      expect(submitButton.props().disabled).toBe(false)

      props.pristine = true
      shallowRenderForm(props)
      submitButton = ContactDetailsFormWrapper.find(RaisedButton)
      expect(submitButton.props().disabled).toBe(true)
    })
  })

  describe('validate function', () => {
    const props = {
      handleSubmit: () => {},
      intl: {
        formatMessage: message => message.defaultMessage,
      },
    }
    let initialContactDetails

    beforeEach(() => {
      initialContactDetails = Immutable.Map({
        name: 'John Smith',
        email: null,
        email2: null,
      })
    })

    it('should validate that name has been entered', () => {
      expect(validate(initialContactDetails, props)).toEqual({})
      const contactDetails = initialContactDetails.set('name', '')
      expect(validate(contactDetails, props)).toEqual({
        name: 'Please enter your Full name',
      })
    })

    it('should validate email addresses if they have been entered', () => {
      let contactDetails = initialContactDetails.set('email', 'invalid email')
      expect(validate(contactDetails, props)).toEqual({
        email: 'Please enter a valid email address',
      })

      contactDetails = initialContactDetails.set('email2', 'invalid email')
      expect(validate(contactDetails, props)).toEqual({
        email2: 'Please enter a valid email address',
      })
    })

    it('should validate name and both email addresses', () => {
      let contactDetails = initialContactDetails.merge({
        name: '',
        email: 'Invalid Email',
        email2: 'Another Invalid Email',
      })
      expect(validate(contactDetails, props)).toEqual({
        email: 'Please enter a valid email address',
        email2: 'Please enter a valid email address',
        name: 'Please enter your Full name',
      })

      contactDetails = contactDetails.set('name', 'Abu Jenkins')
      expect(validate(contactDetails, props)).toEqual({
        email: 'Please enter a valid email address',
        email2: 'Please enter a valid email address',
      })

      contactDetails = contactDetails.set('email2', 'valid@email.address')
      expect(validate(contactDetails, props)).toEqual({
        email: 'Please enter a valid email address',
      })

      contactDetails = contactDetails.set(
        'email',
        'another.valid@email.address'
      )
      expect(validate(contactDetails, props)).toEqual({})
    })

    it('should be able to handle an undefined parameter', () => {
      expect(validate(undefined, props)).toEqual({})
    })
  })
})
