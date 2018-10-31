import React from 'react'
import ReactTestRenderer from 'react-test-renderer'
import { mount, shallow } from 'enzyme'
import sinon from 'sinon'
import Input from 'react-toolbox/lib/input'
import { enhance, DateTimePicker } from './DateTimePicker'

jest.useFakeTimers()

describe('DateTimePicker component', () => {
  function renderDateTimePicker(props) {
    return shallow(<DateTimePicker {...props} />)
  }

  const props = {
    value: new Date(2018, 10, 5, 15, 30),
    dateTime: new Date(2018, 10, 5, 15, 30),
    onSelectDate: sinon.spy(),
    onSelectTime: sinon.spy(),
    onCancel: sinon.spy(),
  }

  it('should shallow render correctly', () => {
    const element = ReactTestRenderer.create(<DateTimePicker {...props} />)
    expect(element).toMatchSnapshot()
  })

  it('should show Date Picker when focus the input', () => {
    const dateTimePicker = renderDateTimePicker(props)
    const dateTimeInput = dateTimePicker.find(Input)

    const { onSelectDate } = props
    expect(onSelectDate.callCount).toBe(0)

    dateTimeInput.simulate('focus')

    expect(onSelectDate.callCount).toBe(1)
  })

  it('should call onChange when date/time is selected', () => {
    let innerProps
    const handleChange = sinon.spy()
    const DecoratedComponent = enhance(props => {
      innerProps = props
      return <div />
    })

    mount(<DecoratedComponent {...props} onChange={handleChange} />)
    expect(handleChange.callCount).toBe(0)
    const selectedDate = new Date(2018, 10, 5, 15, 30, 30)
    innerProps.onSelectTime(selectedDate)
    expect(handleChange.callCount).toBe(1)
    expect(handleChange.lastCall.args).toEqual([selectedDate])
  })
})
