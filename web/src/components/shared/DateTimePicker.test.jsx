import React from 'react'
import PropTypes from 'prop-types'
import ReactShallowRenderer from 'react-test-renderer/shallow'
import { mount } from 'enzyme'
import sinon from 'sinon'
import { addMinutes, subMinutes } from 'date-fns'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import TextField from 'material-ui/TextField'
import DatePickerDialog from 'material-ui/DatePicker/DatePickerDialog'
import DateTimePicker from './DateTimePicker'

const getLocalDateTime = date => {
  const offset = date.getTimezoneOffset()

  return Math.sign(offset) !== -1
    ? subMinutes(date, offset)
    : addMinutes(date, Math.abs(offset))
}

jest.mock('../../shared/utils/dateFormat', () => ({
  formatDateTime: () => '2018-11-05 07:30:00',
}))

jest.useFakeTimers()

describe('DateTimePicker component', () => {
  const props = {
    value: getLocalDateTime(new Date(2018, 10, 5, 7, 30)),
  }

  const mountWithMuiTheme = node =>
    mount(node, {
      context: {
        muiTheme: getMuiTheme(),
      },
      childContextTypes: {
        muiTheme: PropTypes.object.isRequired,
      },
    })

  const mockEvent = {
    preventDefault() {},
    stopPropagation() {},
  }

  it('should shallow render correctly', () => {
    const renderer = ReactShallowRenderer.createRenderer()

    const element = renderer.render(<DateTimePicker {...props} />)
    expect(element).toMatchSnapshot()
  })

  it('should show Date Picker when click the input', () => {
    const dateTimePicker = mountWithMuiTheme(<DateTimePicker {...props} />)
    const dateTimeInput = dateTimePicker.find(TextField)
    dateTimeInput.find('input').simulate('click', mockEvent)
    dateTimePicker.update()
    expect(dateTimePicker.find(DatePickerDialog).length).toEqual(1)
  })

  it('should call onChange when date/time is selected', () => {
    const handleChange = sinon.spy()
    const dateTimePicker = mountWithMuiTheme(
      <DateTimePicker {...props} onChange={handleChange} />
    )
    expect(handleChange.callCount).toBe(0)
    const selectedDate = new Date(2018, 10, 5, 15, 30, 0)

    dateTimePicker.instance().selectTime(selectedDate)
    expect(handleChange.callCount).toBe(1)
    expect(handleChange.lastCall.args).toEqual([selectedDate])
  })
})
