import React from 'react'
import { styled, TextField } from '@mui/material'
import { MobileDatePicker } from '@mui/x-date-pickers'
import { PickersDay } from '@mui/x-date-pickers/PickersDay'
import classnames from 'classnames/bind'
import isEqual from 'date-fns/isEqual'
import startOfDay from 'date-fns/startOfDay'
import { useFormikContext } from 'formik'
import get from 'lodash/get'
import isBoolean from 'lodash/isBoolean'
import isNil from 'lodash/isNil'
import omit from 'lodash/omit'
import omitBy from 'lodash/omitBy'
import pick from 'lodash/pick'
import PropTypes from 'prop-types'
import { useAuthState } from '../../../providers/AuthProvider'
import { getDateObject } from '../../../utils/utils/dateFormat'
import styles from './DatePicker.css'

import 'react-datepicker/dist/react-datepicker-cssmodules.min.css'

const cssClasses = classnames.bind(styles)
const CustomPickersDay = styled(PickersDay, {
  shouldForwardProp: prop => prop !== 'dayIsBetween' && prop !== 'isFirstDay' && prop !== 'isLastDay',
})(({ theme, dayIsBetween, isFirstDay, isLastDay }) => ({
  ...(dayIsBetween && {
    borderRadius: 0,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    '&:hover, &:focus': {
      backgroundColor: theme.palette.primary.dark,
    },
  }),
  ...(isFirstDay && {
    borderTopLeftRadius: '50%',
    borderBottomLeftRadius: '50%',
    borderTopRightRadius: '0%',
    borderBottomRightRadius: '0%',
  }),
  ...(isLastDay && {
    borderTopRightRadius: '50%',
    borderBottomRightRadius: '50%',
  }),
}))
const renderWeekPickerDay = (start, end, date, selectedDates, pickersDayProps) => {
  const dayIsBetween = start <= date && end >= date

  const isFirstDay = isEqual(startOfDay(start), startOfDay(date)) // date.isSame(start, 'day')

  const isLastDay = isEqual(startOfDay(end), startOfDay(date))

  return (
    <CustomPickersDay
      {...pickersDayProps}
      disableMargin
      dayIsBetween={dayIsBetween}
      isFirstDay={isFirstDay}
      isLastDay={isLastDay}
    />
  )
}

const AspectDatePickerBase = props => {
  const { className, dateFormat, InputProps, onChange, placeholder, value } = props

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
  }

  return (
    <MobileDatePicker
      dateFormat={dateFormat}
      {...optionalProps}
      label={placeholder}
      value={value}
      renderDay={(date, selectedDays, pickersDayProps) =>
        renderWeekPickerDay(props.startDate, props.endDate, date, selectedDays, pickersDayProps)
      }
      onChange={(date, event) => updateSelectDate(date, event)}
      disabled={InputProps.disabled}
      className={className}
      renderInput={params => (
        <TextField
          {...params}
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
            'transformTimezone',
          ])}
          className={cssClasses('datepicker__TextField')}
        />
      )}
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
