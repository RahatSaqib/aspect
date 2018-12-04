import React, { Component } from 'react'
import _ from 'lodash'
import DatePickerDialog from 'material-ui/DatePicker/DatePickerDialog'
import TimePickerDialog from 'material-ui/TimePicker/TimePickerDialog'
import TextField from 'material-ui/TextField'

import { formatDateTime } from '../../shared/utils/dateFormat'

class DateTimePicker extends Component {
  constructor(props) {
    super(props)

    this.datePickerRef = React.createRef()
    this.timePickerRef = React.createRef()

    this.state = {
      dateTime: this.props.value || new Date(),
    }
  }

  getDisplayDate = () => {
    const { value } = this.props
    return value === undefined ? '' : formatDateTime(value)
  }

  openDatePicker = event => {
    event.preventDefault()
    this.datePickerRef.current.show()
  }

  selectDate = date => {
    const { dateTime } = this.state
    this.setState(
      {
        dateTime: _.isDate(date) ? date : dateTime,
      },
      this.timePickerRef.current.show()
    )
  }

  selectTime = date => {
    const { dateTime } = this.state
    dateTime.setHours(date.getHours())
    dateTime.setMinutes(date.getMinutes())

    this.setState({ dateTime })
    this.props.onChange(dateTime)
  }

  render() {
    const { dateTime } = this.state

    return (
      <div>
        <TextField
          name="datetime"
          value={this.getDisplayDate()}
          onClick={this.openDatePicker}
          underlineFocusStyle={{
            borderColor: '#3F51B5',
          }}
          readOnly
        />
        <DatePickerDialog
          ref={this.datePickerRef}
          initialDate={dateTime}
          autoOk={false}
          mode="portrait"
          firstDayOfWeek={1}
          onAccept={this.selectDate}
        />
        <TimePickerDialog
          ref={this.timePickerRef}
          initialDate={dateTime}
          format="24hr"
          minutesStep={1}
          autoOk={false}
          onAccept={this.selectTime}
        />
      </div>
    )
  }
}

export default DateTimePicker
