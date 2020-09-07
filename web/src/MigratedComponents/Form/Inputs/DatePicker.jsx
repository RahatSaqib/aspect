import React, { useState } from 'react'
import PropTypes from 'prop-types'
import DatePicker, { registerLocale, setDefaultLocale } from 'react-datepicker'
import { useSelector, shallowEqual } from 'react-redux'
import TextField from '@material-ui/core/TextField'
import enUS from 'date-fns/locale/en-US'

import 'react-datepicker/dist/react-datepicker-cssmodules.min.css'

const AspectDatePicker = props => {
  const {
    id,
    value,
    InputProps,
    formik,
    showTimeSelect,
    placeholder,
    className,
  } = props

  const [startDate, setStartDate] = useState(value ? new Date(value) : null)
  const { displayPreferences, culture } = useSelector(({ user }) => ({
    ...user.toJS(),
  }))
  registerLocale(culture, enUS)

  const updateStartDate = date => {
    formik.setFieldValue(id, date)
    setStartDate(date)
  }

  return (
    <DatePicker
      className={className}
      showTimeSelect={showTimeSelect}
      selected={startDate}
      dateFormat={displayPreferences.dateTimeFormat}
      onChange={date => updateStartDate(date)}
      customInput={<TextField {...props} />}
      disabled={InputProps.disabled}
      placeholderText={placeholder}
      value={startDate}
      locale={culture}
    />
  )
}

AspectDatePicker.defaultProps = {
  showTimeSelect: new Date(),
  placeholder: '',
  className: '',
}

AspectDatePicker.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.object]).isRequired,
  InputProps: PropTypes.oneOfType([PropTypes.object]).isRequired,
  formik: PropTypes.oneOfType([PropTypes.object]).isRequired,
  showTimeSelect: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  placeholder: PropTypes.string,
  className: PropTypes.string,
}

const AspectDateTimePicker = props => {
  const mergedProps = { ...props, showTimeSelect: true }
  return <AspectDatePicker {...mergedProps} />
}

export { AspectDatePicker, AspectDateTimePicker }
