import React from 'react'

import AspectTextField from './TextField'
import AspectTextArea from './TextArea'
import PlaceholderTextField from './PlaceholderTextField'
import PlaceholderTextArea from './PlaceholderTextArea'
import { AspectDatePicker, AspectDateTimePicker, AspectDatePickerNoTimezone } from './DatePicker'
import AspectSelect from './Select'
import Checkbox from './Checkbox'

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
}

const AspectInput = props => {
  const Component = Inputs[props.controlType.component]
  return Component ? <Component {...props} /> : null
}

export default AspectInput
