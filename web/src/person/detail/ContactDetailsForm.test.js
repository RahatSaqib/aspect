import React from 'react'
import { assert } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import Immutable from 'immutable'
import TextInput from '../../components/shared/TextInput'
import PhoneInput from '../../components/shared/PhoneInput'
import RaisedButton from 'material-ui/RaisedButton'
import LocationSelector from '../../components/shared/LocationSelector'

describe('ContactDetailsForm Component', () => {
  const fakeReactIntl = {
    injectIntl: component => component,
    defineMessages: messages => messages
  }

  describe('ContactDetailsForm', () => {
    const fakeReduxForm = {
        reduxForm: () => component => component
      }, ContactDetailsForm = proxyquire('./ContactDetailsForm', {
        'redux-form/immutable': fakeReduxForm,
        'react-intl': fakeReactIntl
      }).default

    let props, ContactDetailsFormWrapper

    const shallowRenderForm = props => {
      ContactDetailsFormWrapper = shallow(<ContactDetailsForm {...props}/>)
    }

    beforeEach(() => {
      props = {
        pristine: true,
        invalid: true,
        loading: false,
        initialValues: {
          countryId: null,
          stateId: null
        },
        handleSubmit: () => {},
        intl: {
          formatMessage: message => message.defaultMessage
        }
      }
      shallowRenderForm(props)
    })

    it('Should be a form', () => {
      assert.equal(ContactDetailsFormWrapper.node.type, 'form')
      assert.equal(ContactDetailsFormWrapper.find('form').props().onSubmit, props.handleSubmit)
    })

    it('Should contain fields for all contact details', () => {
      const expectedTextFieldLabels = {
          'name': 'Full Name',
          'title': 'Job Title',
          'email': 'Primary',
          'email2': 'Alternate',
          'zip': 'Zip Code'
        }, expectedPhoneFieldLabels = {
          'phone': 'Telephone',
          'cell': 'Mobile'
        }, textInputs = ContactDetailsFormWrapper.find(TextInput),
        phoneInputs = ContactDetailsFormWrapper.find(PhoneInput)

      assert.equal(textInputs.length, Object.keys(expectedTextFieldLabels).length)
      textInputs.forEach(textInput => {
        assert.equal(textInput.props().label, expectedTextFieldLabels[textInput.props().name])
      })
      phoneInputs.forEach(phoneInput => {
        assert.equal(phoneInput.props().label, expectedPhoneFieldLabels[phoneInput.props().name])
      })
    })

    it('Should disable all fields when form is loading', () => {
      ContactDetailsFormWrapper.find(TextInput).forEach(textInput => {
        assert.isFalse(textInput.props().disabled)
      })
      props.loading = true
      shallowRenderForm(props)
      ContactDetailsFormWrapper.find(TextInput).forEach(textInput => {
        assert.isTrue(textInput.props().disabled)
      })
    })

    it('Should contain a location selector', () => {
      const locationSelector = ContactDetailsFormWrapper.find(LocationSelector)
      assert.equal(locationSelector.length, 1)
      assert.deepEqual(locationSelector.props(), {
        initialValues: props.initialValues,
        formName: 'accountDetails',
        countryIdFieldName: 'countryId',
        stateIdFieldName: 'stateId',
        lgaIdFieldName: 'lgaId',
        loading: props.loading
      })
    })

    it('Should contain a submit button', () => {
      const submitButton = ContactDetailsFormWrapper.find(RaisedButton)
      assert.equal(submitButton.length, 1)
      assert.deepEqual(submitButton.props(), {
        ...submitButton.props(),
        label: 'Save',
        secondary: true,
        type: 'submit',
        disabled: props.loading || props.invalid || props.pristine
      })
    })

    it('Should enable the submit button when the form is dirty, valid and not submitting', () => {
      let submitButton = ContactDetailsFormWrapper.find(RaisedButton)
      assert.isTrue(submitButton.props().disabled)

      props.pristine = false
      shallowRenderForm(props)
      submitButton = ContactDetailsFormWrapper.find(RaisedButton)
      assert.isTrue(submitButton.props().disabled)

      props.invalid = false
      shallowRenderForm(props)
      submitButton = ContactDetailsFormWrapper.find(RaisedButton)
      assert.isFalse(submitButton.props().disabled)

      props.pristine = true
      shallowRenderForm(props)
      submitButton = ContactDetailsFormWrapper.find(RaisedButton)
      assert.isTrue(submitButton.props().disabled)
    })
  })

  describe('reduxForm', () => {
    let reduxFormStub, reduxFormConfig

    beforeEach(() => {
      reduxFormStub = {
        reduxForm: sinon.stub().returns(() => {})
      }
      proxyquire('./ContactDetailsForm', {
        'redux-form/immutable': reduxFormStub,
        'react-intl': fakeReactIntl
      })
      reduxFormConfig = reduxFormStub.reduxForm.firstCall.args[0]
    })

    it('Should create a form called \'accountDetails\'', () => {
      assert.equal(reduxFormConfig.form, 'accountDetails')
    })

    describe('validate function', () => {
      const props = {
        intl: {
          formatMessage: message => message.defaultMessage
        }
      }
      let validateFunction, initialAccountDetails

      beforeEach(() => {
        validateFunction = reduxFormConfig.validate
        initialAccountDetails = Immutable.Map({
          name: 'John Smith',
          email: null,
          email2: null
        })
      })

      it('Should validate that name has been entered', () => {
        assert.deepEqual(validateFunction(initialAccountDetails, props), {})
        const accountDetails = initialAccountDetails.set('name', '')
        assert.deepEqual(validateFunction(accountDetails, props), {
          name: 'Please enter your Full name'
        })
      })

      it('Should validate email addresses if they have been entered', () => {
        let accountDetails = initialAccountDetails.set('email', 'invalid email')
        assert.deepEqual(validateFunction(accountDetails, props), {
          email: 'Please enter a valid email address'
        })

        accountDetails = initialAccountDetails.set('email2', 'invalid email')
        assert.deepEqual(validateFunction(accountDetails, props), {
          email2: 'Please enter a valid email address'
        })
      })

      it('Should validate name and both email addresses', () => {
        let accountDetails = initialAccountDetails.merge({
          name: '',
          email: 'Invalid Email',
          email2: 'Another Invalid Email'
        })
        assert.deepEqual(validateFunction(accountDetails, props), {
          email: 'Please enter a valid email address',
          email2: 'Please enter a valid email address',
          name: 'Please enter your Full name'
        })

        accountDetails = accountDetails.set('name', 'Abu Jenkins')
        assert.deepEqual(validateFunction(accountDetails, props), {
          email: 'Please enter a valid email address',
          email2: 'Please enter a valid email address'
        })

        accountDetails = accountDetails.set('email2', 'valid@email.address')
        assert.deepEqual(validateFunction(accountDetails, props), {
          email: 'Please enter a valid email address'
        })

        accountDetails = accountDetails.set('email', 'another.valid@email.address')
        assert.deepEqual(validateFunction(accountDetails, props), {})
      })
    })
  })
})
