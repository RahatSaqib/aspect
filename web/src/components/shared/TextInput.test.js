import React from 'react'
import { Field } from 'redux-form/immutable'
import { assert } from 'chai'
import { shallow } from 'enzyme'
import TextInput from './TextInput'

describe('TextInput', () => {
  it('Should render a Field and pass the props assigned to it', () => {
    const props = {
        name: 'fieldName',
        label: 'Field Label',
        disabled: false,
        fullWidth: true,
        maxLength: 50
      }, TextInputWrapper = shallow(<TextInput {...props}/>),
      textInputProps = TextInputWrapper.find(Field).props()

    assert.equal(textInputProps.name, props.name)
    assert.deepEqual(textInputProps.textFieldProps, {
      floatingLabelText: props.label,
      fullWidth: props.fullWidth,
      disabled: props.disabled,
      maxLength: props.maxLength,
      multiLine: props.multiLine,
      rows: props.rows,
      type: 'text',
      autoFocus: undefined
    })
  })

  it('Should render a Password Field when type is specified as password', () => {
    const props = {
        name: 'fieldName',
        label: 'Field Label',
        disabled: false,
        fullWidth: true,
        maxLength: 50,
        type: 'password'
      }, TextInputWrapper = shallow(<TextInput {...props}/>),
      textInputProps = TextInputWrapper.find(Field).props()

    assert.equal(textInputProps.name, props.name)
    assert.deepEqual(textInputProps.textFieldProps, {
      floatingLabelText: props.label,
      fullWidth: props.fullWidth,
      disabled: props.disabled,
      maxLength: props.maxLength,
      multiLine: props.multiLine,
      rows: props.rows,
      type: 'password',
      autoFocus: undefined
    })
  })
})
