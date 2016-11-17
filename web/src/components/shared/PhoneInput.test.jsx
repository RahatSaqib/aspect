import React from 'react'
import { assert } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import TextField from 'material-ui/TextField'
import { Field } from 'redux-form/immutable'
import CountrySelect from './CountrySelect'
import PhoneInput from './PhoneInput'

describe('PhoneInput Field Component', () => {
  let props
  let PhoneInputFieldWrapper
  let phoneInputProps
  beforeEach(() => {
    props = {
      name: 'fieldName',
      label: 'Field Label',
      disabled: false,
      maxLength: 50
    }
    PhoneInputFieldWrapper = shallow(<PhoneInput {...props} />)
    phoneInputProps = PhoneInputFieldWrapper.find(Field).props()
  })

  it('Should render a Field and pass the props assigned to it', () => {
    assert.equal(phoneInputProps.name, props.name)
    assert.deepEqual(phoneInputProps.textFieldProps, {
      floatingLabelText: props.label,
      disabled: props.disabled,
      maxLength: props.maxLength
    })
  })

  describe('PhoneInput Component', () => {
    let PhoneInputWrapper
    let PhoneInputType
    let phoneFieldProps
    let phoneInputTypeProps

    beforeEach(() => {
      phoneFieldProps = {
        name: props.name,
        textFieldProps: {
          floatingLabelText: props.label,
          disabled: props.disabled,
          maxLength: props.maxLength
        },
        input: {
          onChange: sinon.spy()
        },
        meta: { }
      }
      PhoneInputType = PhoneInputFieldWrapper.props().component(phoneFieldProps).type
      phoneInputTypeProps = {
        onChange: phoneFieldProps.input.onChange,
        input: phoneFieldProps.input,
        meta: phoneFieldProps.meta,
        textFieldProps: phoneFieldProps.textFieldProps
      }

      PhoneInputWrapper = shallow(<PhoneInputType {...phoneInputTypeProps} />)
    })

    it('Should render a CountrySelect and a TextField', () => {
      assert.equal(PhoneInputWrapper.find(CountrySelect).length, 1)
      assert.equal(PhoneInputWrapper.find(TextField).length, 1)
    })

    it('Should have an initial state of US and no phone number', () => {
      assert.deepEqual(PhoneInputWrapper.state(), {
        selectedIsoAlpha2Code: 'US',
        number: ''
      })
    })

    it('Should set the country dialing code when it is entered into the text field', () => {
      PhoneInputWrapper.find(TextField).simulate('change', { target: { value: '+44 0711 234 3211' } })
      assert.deepEqual(PhoneInputWrapper.state(), {
        selectedIsoAlpha2Code: 'GB',
        number: '0711 234 3211'
      })
    })

    it('Should set the country code of the phone number when a country is selected in the dropdown', () => {
      PhoneInputWrapper.find(CountrySelect).simulate('change', undefined, undefined, 'US')
      assert.deepEqual(phoneFieldProps.input.onChange.lastCall.args, ['+1'])
    })

    it('Should set the call onChange with the full phone number when the country is changed and a number is entered into the text field', () => {
      PhoneInputWrapper.find(CountrySelect).simulate('change', undefined, undefined, 'ZA')
      PhoneInputWrapper.find(TextField).simulate('change', { target: { value: '123 4567' } })

      assert.deepEqual(phoneFieldProps.input.onChange.lastCall.args, ['+27 123 4567'])
    })
  })
})
