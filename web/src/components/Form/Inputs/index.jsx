import React from 'react'
import Cron from '../../Cron/index'
import Checkbox from './Checkbox'
import { AspectDatePicker, AspectDateTimePicker, AspectDatePickerNoTimezone } from './DatePicker'
import PlaceholderTextArea from './PlaceholderTextArea'
import PlaceholderTextField from './PlaceholderTextField'
import AspectSelect from './Select'
import AspectTextArea from './TextArea'
import AspectTextField from './TextField'

const Inputs = {
  textArea: AspectTextArea,
  textField: AspectTextField,
  placeholderTextArea: PlaceholderTextArea,
  placeholderTextField: PlaceholderTextField,
  datePicker: AspectDatePicker,
  dateTimePicker: AspectDateTimePicker,
  datePickerNoTimezone: AspectDatePickerNoTimezone,
  select: AspectSelect,
  checkbox: Checkbox,
  cron: Cron,
}

const AspectInput = props => {
  const Component = Inputs[props.controlType.component]
  return Component ? <Component {...props} /> : null
}

export default AspectInput
