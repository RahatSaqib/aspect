import React from 'react'
import { Field } from 'redux-form/immutable'
import { shallow } from 'enzyme'
import TextInput from './TextInput'

describe('TextInput', () => {
  it('Should render a Field and pass the props assigned to it', () => {
    const props = {
      name: 'fieldName',
      label: 'Field Label',
      disabled: false,
      maxLength: 50,
      theme: {},
    }
    const TextInputWrapper = shallow(<TextInput {...props} />)
    const textInputProps = TextInputWrapper.find(Field).props()

    expect(textInputProps.name).toEqual(props.name)
    expect(textInputProps.textFieldProps).toEqual({
      label: props.label,
      disabled: props.disabled,
      maxLength: props.maxLength,
      multiLine: props.multiLine,
      rows: props.rows,
      type: 'text',
      autoFocus: undefined,
      style: undefined,
      theme: props.theme,
    })
  })

  it('Should render a Password Field when type is specified as password', () => {
    const props = {
      name: 'fieldName',
      label: 'Field Label',
      disabled: false,
      maxLength: 50,
      type: 'password',
    }
    const TextInputWrapper = shallow(<TextInput {...props} />)
    const textInputProps = TextInputWrapper.find(Field).props()

    expect(textInputProps.name).toEqual(props.name)
    expect(textInputProps.textFieldProps).toEqual({
      label: props.label,
      disabled: props.disabled,
      maxLength: props.maxLength,
      multiLine: props.multiLine,
      rows: props.rows,
      type: 'password',
      autoFocus: undefined,
      style: undefined,
      theme: undefined,
    })
  })
})
