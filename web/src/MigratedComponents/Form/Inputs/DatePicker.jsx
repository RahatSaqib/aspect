import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import DatePicker, { registerLocale } from 'react-datepicker'
import { useSelector } from 'react-redux'
import TextField from '@material-ui/core/TextField'
import enUS from 'date-fns/locale/en-US'

import { formatDateTime } from '../../../shared/utils/dateFormat'

import 'react-datepicker/dist/react-datepicker-cssmodules.min.css'

const cssClasses = classnames.bind(require('./DatePicker.css'))

const AspectDatePicker = props => {
  registerLocale(culture, enUS)
  const {
    id,
    value,
    InputProps,
    formik,
    showTimeSelect,
    placeholder,
    className,
    controlType,
  } = props

  const { format: dateFormat } = controlType || false
  const [selectDate, setSelectDate] = useState()
  const [currentDate] = useState(value ? formatDateTime(value) : null)
  const { displayPreferences, culture } = useSelector(({ user }) => ({
    ...user.toJS(),
  }))

  const updateSelectDate = date => {
    formik.setFieldValue(id, date)
    setSelectDate(formatDateTime(date))
  }

  return (
    <DatePicker
      wrapperClassName={cssClasses('datepicker__wrapper')}
      className={className}
      showTimeSelect={showTimeSelect}
      selected={selectDate}
      dateFormat={dateFormat || displayPreferences.dateTimeFormat}
      onChange={date => updateSelectDate(date)}
      customInput={<TextField {...props} />}
      disabled={InputProps.disabled}
      placeholderText={placeholder}
      value={currentDate}
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
  controlType: PropTypes.oneOfType([PropTypes.object]).isRequired,
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
