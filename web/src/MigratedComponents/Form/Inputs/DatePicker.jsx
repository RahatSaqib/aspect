import React, { useState } from 'react'
import DatePicker from 'react-datepicker'
import { useSelector, shallowEqual } from 'react-redux'
import TextField from '@material-ui/core/TextField'
import 'react-datepicker/dist/react-datepicker-cssmodules.min.css'

const AspectDatePicker = props => {
  const { id, value, InputProps, formik, showTimeSelect = false } =
    props || new Date()
  const [startDate, setStartDate] = useState(new Date(value))
  const { displayPreferences, culture } = useSelector(({ user }) => ({
    ...user.toJS(),
  }))

  const updateStartDate = date => {
    formik.setFieldValue(id, date)
    setStartDate(date)
  }

  return (
    <DatePicker
      showTimeSelect={showTimeSelect}
      selected={startDate}
      dateFormat={displayPreferences.dateTimeFormat}
      onChange={date => updateStartDate(date)}
      customInput={<TextField {...props} />}
      disabled={InputProps.disabled}
      value={startDate}
      locale={culture}
    />
  )
}

const AspectDateTimePicker = props => {
  const mergedProps = { ...props, showTimeSelect: true }
  return <AspectDatePicker {...mergedProps} />
}

export { AspectDatePicker, AspectDateTimePicker }
