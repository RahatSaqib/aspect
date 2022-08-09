import React, { useState } from 'react'
import get from 'lodash/get'
import pick from 'lodash/pick'
import omit from 'lodash/omit'
import omitBy from 'lodash/omitBy'
import isBoolean from 'lodash/isBoolean'
import isNil from 'lodash/isNil'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import DatePicker, { registerLocale } from 'react-datepicker'
import TextField from '@mui/material/TextField'
import enUS from 'date-fns/locale/en-US'
import { useFormikContext } from 'formik'
import useI18n from '../../../Hooks/i18n/useI18n'
import { formatDate, formatDateTime, getDateObject } from '../../../shared/utils/dateFormat'
import { useAuthState } from '../../../Providers/AuthProvider'
import messages from '../messages'
import styles from './DatePicker.css'
import 'react-datepicker/dist/react-datepicker-cssmodules.min.css'

const cssClasses = classnames.bind(styles)

const getDisplayValue = (value, showTimeSelect) => {
  return value ? (showTimeSelect ? formatDateTime(value) : formatDate(value)) : null
}

const AspectDatePickerBase = props => {
  const { formatMessage, formatDate } = useI18n()
  const {
    className,
    culture,
    dateFormat,
    InputProps,
    onChange,
    placeholder,
    showTimeSelect,
    transformTimezone = true,
    value,
  } = props
  registerLocale(culture, enUS)
  const [selectedDate, setSelectedDate] = useState(
    getDateObject(
      transformTimezone || !value
        ? value
        : formatDate(new Date(value).toLocaleDateString('en-US', { timeZone: 'UTC' }), 'yyyy-MM-dd')
    )
  )

  // skip all 'null' and 'undefined' props
  const optionalProps = omitBy(
    pick(props, [
      'selectsStart',
      'selectsEnd',
      'startDate',
      'endDate',
      'minDate',
      'maxDate',
      'timeIntervals',
      'isClearable',
    ]),
    v => isNil(v)
  )

  const updateSelectDate = (date, event) => {
    let newValue = date
    if (!date && event) {
      const { target: { className = '' } = {} } = event
      if (className.includes('datepicker__clearButton')) {
        // change `null` to empty string because
        // `value` is required in below propTypes
        newValue = ''
      }
    }
    onChange(newValue)
    setSelectedDate(newValue)
  }

  return (
    <DatePicker
      {...optionalProps}
      wrapperClassName={cssClasses('datepicker__wrapper', {
        'datepicker__no-value': !selectedDate,
      })}
      className={className}
      showTimeSelect={showTimeSelect}
      selected={selectedDate}
      dateFormat={dateFormat}
      onChange={(date, event) => updateSelectDate(date, event)}
      customInput={
        <TextField
          {...omit(props, [
            'classNames',
            'dateFormat',
            'showTimeSelect',
            'validate',
            'selectsStart',
            'selectsEnd',
            'startDate',
            'endDate',
            'minDate',
            'maxDate',
            'link',
            'timeIntervals',
            'isClearable',
          ])}
          className={cssClasses('datepicker__TextField')}
        />
      }
      disabled={InputProps.disabled}
      placeholderText={placeholder}
      value={getDisplayValue(selectedDate, showTimeSelect)}
      locale={culture}
      clearButtonClassName={cssClasses('datepicker__clearButton')}
      clearButtonTitle={formatMessage(messages.clearValue)}
    />
  )
}

const AspectDatePicker = props => {
  const { updateField, toggleEdit } = useFormikContext()
  const { displayPreferences, culture } = useAuthState()
  const { formik, classNames, controlType, ...rest } = props
  const { values } = formik
  const {
    format,
    showTimeSelect,
    // flags for date range
    selectsStart,
    selectsEnd,
    // field names for date range
    startDateId,
    endDateId,
    minDateId,
    maxDateId,
    timeIntervals,
  } = controlType
  let { isClearable } = controlType
  if (isClearable && rest?.InputProps?.disabled) {
    isClearable = false
  }

  // skip all 'null' and 'undefined' props
  const optionalProps = omitBy(
    {
      selectsStart,
      selectsEnd,
      startDate: startDateId ? getDateObject(values[startDateId], null) : null,
      endDate: endDateId ? getDateObject(values[endDateId], null) : null,
      minDate: minDateId ? getDateObject(values[minDateId], null) : null,
      maxDate: maxDateId ? getDateObject(values[maxDateId], null) : null,
      timeIntervals,
      isClearable,
    },
    v => isNil(v)
  )
  // show error only for touched fields
  let errorProps = {}
  const error = get(formik.errors, props.id)
  if (error && get(formik.touched, props.id)) {
    errorProps = {
      ...errorProps,
      error: true,
      helperText: error,
    }
  }

  // effective props for pure component
  const mergedProps = {
    ...rest,
    ...optionalProps,
    ...errorProps,
    culture,
    onChange: value => {
      updateField(props.id, value, { formik, toggleEdit })
    },
    dateFormat: format || displayPreferences.dateTimeFormat, // use `format` from `controlType` or default
    showTimeSelect: isBoolean(props.showTimeSelect)
      ? props.showTimeSelect // use direct prop if defined
      : showTimeSelect, // otherwise use value from `controlType`
  }

  return <AspectDatePickerBase {...mergedProps} />
}

AspectDatePicker.defaultProps = {
  showTimeSelect: false,
  placeholder: '',
  className: '',
  classNames: null,
}

AspectDatePicker.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
  InputProps: PropTypes.oneOfType([PropTypes.object]).isRequired,
  controlType: PropTypes.oneOfType([PropTypes.object]).isRequired,
  formik: PropTypes.oneOfType([PropTypes.object]).isRequired,
  showTimeSelect: PropTypes.bool,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  classNames: PropTypes.oneOfType([PropTypes.object]),
}

const AspectDateTimePicker = props => {
  const mergedProps = { ...props, showTimeSelect: true }
  return <AspectDatePicker {...mergedProps} />
}

const AspectDatePickerNoTimezone = props => {
  const mergedProps = { ...props, transformTimezone: false }
  return <AspectDatePicker {...mergedProps} />
}

export { AspectDatePicker, AspectDateTimePicker, AspectDatePickerNoTimezone }
