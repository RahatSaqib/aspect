import React from 'react'
import { Field } from 'redux-form/immutable'
import { shallow } from 'enzyme'
import _ from 'lodash'
import MenuItem from 'material-ui/MenuItem'
import SelectInput from './SelectInput'

describe('SelectInput', () => {
  const props = {
    name: 'fieldName',
    label: 'Field Label',
    autoWidth: false,
    disabled: false,
    dataSource: [{ personId: '123', fullName: 'Jim Jefferson' },
      { personId: '124', fullName: 'Billy Idol' },
      { personId: '125', fullName: 'Eddy Grant' }],
    dataSourceConfig: { value: 'personId', text: 'fullName' },
    fullWidth: true,
    style: {}
  }
  let SelectInputWrapper

  beforeEach(() => {
    SelectInputWrapper = shallow(<SelectInput {...props} />)
  })

  it('Should render a SelectField and pass the props assigned to it', () => {
    const selectInputProps = SelectInputWrapper.find(Field).props()

    expect(selectInputProps.name).toEqual(props.name)
    expect(selectInputProps.selectFieldProps).toEqual({
      floatingLabelText: props.label,
      fullWidth: props.fullWidth,
      disabled: props.disabled,
      autoWidth: false,
      style: props.style
    })
  })

  it('Should Render a SelectField and pass the selectFieldProps to it', () => {
    const selectField = SelectInputWrapper.props().component({
      onSelectionChanged: () => {},
      input: {},
      meta: {},
      selectFieldProps: {
        floatingLabelText: props.label,
        fullWidth: props.fullWidth,
        disabled: props.disabled
      },
      children: []
    })

    expect(selectField.type.name).toEqual('SelectField')
    expect(selectField.props).toEqual({ ...selectField.props,
      errorStyle: {
        float: 'left',
        whiteSpace: 'nowrap',
        textOverflow: 'visible'
      },
      style: {
        verticalAlign: 'bottom'
      },
      floatingLabelText: props.label,
      fullWidth: props.fullWidth,
      disabled: props.disabled
    })
  })

  it('Should create menu items from the datasource and datasource config passed to it', () => {
    expect(SelectInputWrapper.find(MenuItem).length).toEqual(props.dataSource.length)
    _.each(props.dataSource, (item) => {
      expect(SelectInputWrapper.findWhere(
        element => element.type() === MenuItem && element.props().value === item.personId)
        .props().primaryText).toEqual(item.fullName)
    })
  })
})
