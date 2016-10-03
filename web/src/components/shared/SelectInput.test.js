import React from 'react'
import { Field } from 'redux-form/immutable'
import { assert } from 'chai'
import { shallow } from 'enzyme'
import _ from 'lodash'
import MenuItem from 'material-ui/MenuItem'
import SelectInput from './SelectInput'
import SelectField from 'material-ui/SelectField'

describe('SelectInput', () => {
  const props = {
    name: 'fieldName',
    label: 'Field Label',
    disabled: false,
    dataSource: [{personId: '123', fullName: 'Jim Jefferson'},
      {personId: '124', fullName: 'Billy Idol'},
      {personId: '125', fullName: 'Eddy Grant'}],
    dataSourceConfig: { value: 'personId', text: 'fullName' },
    fullWidth: true
  }
  let SelectInputWrapper

  beforeEach(() => {
    SelectInputWrapper = shallow(<SelectInput {...props}/>)
  })

  it('Should render a SelectField and pass the props assigned to it', () => {
    const selectInputProps = SelectInputWrapper.find(Field).props()

    assert.equal(selectInputProps.name, props.name)
    assert.deepEqual(selectInputProps.selectFieldProps, {
      floatingLabelText: props.label,
      fullWidth: props.fullWidth,
      disabled: props.disabled
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

    assert.equal(selectField.type.name, 'SelectField')
    assert.deepEqual(selectField.props, {...selectField.props,
      errorStyle: {
        float: 'left'
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
    assert.equal(SelectInputWrapper.find(MenuItem).length, props.dataSource.length)
    _.each(props.dataSource, item => {
      assert.equal(SelectInputWrapper.findWhere(
        element => element.type() === MenuItem && element.props().value === item.personId)
        .props().primaryText, item.fullName)
    })
  })
})
