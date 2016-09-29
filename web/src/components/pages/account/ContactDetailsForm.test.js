import React from 'react'
import { assert } from 'chai'
import { shallow } from 'enzyme'
import proxyquire from 'proxyquire'
import TextInput from '../../shared/TextInput'
import RaisedButton from 'material-ui/RaisedButton'
import LocationSelector from '../../shared/LocationSelector'

describe('ContactDetailsForm', () => {
  const fakeReduxForm = {
    reduxForm: config => component => component
  }, ContactDetailsForm = proxyquire('./ContactDetailsForm', {
    'redux-form/immutable': fakeReduxForm
  }).default

  let props, ContactDetailsFormWrapper

  const shallowRenderForm = props => {
    ContactDetailsFormWrapper = shallow(<ContactDetailsForm {...props}/>)
  }

  beforeEach(() => {
    props = {
      pristine: true,
      invalid: true,
      submitting: false,
      initialValues: {
        countryId: null,
        stateId: null
      },
      handleSubmit: () => {}
    }
    shallowRenderForm(props)
  })

  it('Should be a form', () => {
    assert.equal(ContactDetailsFormWrapper.node.type, 'form')
    assert.equal(ContactDetailsFormWrapper.find('form').props().onSubmit, props.handleSubmit)
  })

  it('Should contain fields for all contact details', () => {
    const expectedFieldLabels = {
        'name': 'Full Name',
        'title': 'Job Title',
        'email': 'Primary',
        'email2': 'Secondary',
        'phone': 'Telephone',
        'cell': 'Mobile',
        'zip': 'ZIP Code'
      }, textInputs = ContactDetailsFormWrapper.find(TextInput)

    assert.equal(textInputs.length, Object.keys(expectedFieldLabels).length)
    textInputs.forEach(textInput => {
      assert.equal(textInput.props().label, expectedFieldLabels[textInput.props().name])
    })
  })

  it('Should disable all fields when form is submitting', () => {
    ContactDetailsFormWrapper.find(TextInput).forEach(textInput => {
      assert.isFalse(textInput.props().disabled)
    })
    props.submitting = true
    shallowRenderForm(props)
    ContactDetailsFormWrapper.find(TextInput).forEach(textInput => {
      assert.isTrue(textInput.props().disabled)
    })
  })

  it('Should contain a location selector', () => {
    const locationSelector = ContactDetailsFormWrapper.find(LocationSelector)
    assert.equal(locationSelector.length, 1)
    assert.deepEqual(locationSelector.props(), {
      countryIdFieldName: 'countryId',
      initialCountryId: props.initialValues.countryId,
      stateIdFieldName: 'stateId',
      initialStateId: props.initialValues.stateId,
      lgaIdFieldName: 'lgaId',
      disabled: props.submitting
    })
  })

  it('Should contain a submit button', () => {
    const submitButton = ContactDetailsFormWrapper.find(RaisedButton)
    assert.equal(submitButton.length, 1)
    assert.deepEqual(submitButton.props(), {...submitButton.props(),
      label: 'Save',
      secondary: true,
      type: 'submit',
      disabled: props.submitting || props.invalid || props.pristine
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
