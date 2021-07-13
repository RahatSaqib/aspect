import React, { useState } from 'react'
import pick from 'lodash/pick'
import omit from 'lodash/omit'
import omitBy from 'lodash/omitBy'
import isBoolean from 'lodash/isBoolean'
import isNil from 'lodash/isNil'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import DatePicker, { registerLocale } from 'react-datepicker'
import TextField from '@material-ui/core/TextField'
import enUS from 'date-fns/locale/en-US'

import 'react-datepicker/dist/react-datepicker-cssmodules.min.css'

import {
  formatDate,
  formatDateTime,
  getDateObject,
} from '../../../shared/utils/dateFormat'
import { useAuthState } from '../../../Providers/AuthProvider'
import { useFormikState } from '../Formik/Context'

import styles from './DatePicker.css'

const cssClasses = classnames.bind(styles)

const getDisplayValue = (value, showTimeSelect) => {
  return value
    ? showTimeSelect
      ? formatDateTime(value)
      : formatDate(value)
    : null
}

const AspectDatePickerBase = props => {
  const {
    className,
    culture,
    dateFormat,
    InputProps,
    onChange,
    placeholder,
    showTimeSelect,
    value,
  } = props
  registerLocale(culture, enUS)
  const [selectedDate, setSelectedDate] = useState(getDateObject(value))

  // skip all 'null' and 'undefined' props
  const optionalProps = omitBy(
    pick(props, [
      'selectsStart',
      'selectsEnd',
      'startDate',
      'endDate',
      'minDate',
      'maxDate',
    ]),
    v => isNil(v)
  )

  const updateSelectDate = date => {
    onChange(date)
    setSelectedDate(date)
  }

  return (
    <DatePicker
      {...optionalProps}
      wrapperClassName={cssClasses('datepicker__wrapper')}
      className={className}
      showTimeSelect={showTimeSelect}
      selected={selectedDate}
      dateFormat={dateFormat}
      onChange={date => updateSelectDate(date)}
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
          ])}
        />
      }
      disabled={InputProps.disabled}
      placeholderText={placeholder}
      value={getDisplayValue(selectedDate, showTimeSelect)}
      locale={culture}
    />
  )
}

const AspectDatePicker = props => {
  const { updateField } = useFormikState()
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
  } = controlType

  // skip all 'null' and 'undefined' props
  const optionalProps = omitBy(
    {
      selectsStart,
      selectsEnd,
      startDate: startDateId ? getDateObject(values[startDateId], null) : null,
      endDate: endDateId ? getDateObject(values[endDateId], null) : null,
      minDate: minDateId ? getDateObject(values[minDateId], null) : null,
      maxDate: maxDateId ? getDateObject(values[maxDateId], null) : null,
    },
    v => isNil(v)
  )

  // effective props for pure component
  const mergedProps = {
    ...rest,
    ...optionalProps,
    culture,
    onChange: value => {
      updateField(props.id, value, props.formik)
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

export { AspectDatePicker, AspectDateTimePicker }
