import React from 'react'
import Checkbox from './Checkbox'
import CronForm from './CronForm'
import { AspectDatePicker, AspectDateTimePicker, AspectDatePickerNoTimezone } from './DatePicker'
import AspectNumberField from './NumberField'
import PlaceholderTextArea from './PlaceholderTextArea'
import PlaceholderTextField from './PlaceholderTextField'
import RadioButtonList from './RadioButtonList'
import AspectSelect from './Select'
import AspectTextArea from './TextArea'
import AspectTextField from './TextField'

const Inputs = {
  textArea: AspectTextArea,
  textField: AspectTextField,
  numberField: AspectNumberField,
  placeholderTextArea: PlaceholderTextArea,
  placeholderTextField: PlaceholderTextField,
  datePicker: AspectDatePicker,
  dateTimePicker: AspectDateTimePicker,
  datePickerNoTimezone: AspectDatePickerNoTimezone,
  select: AspectSelect,
  checkbox: Checkbox,
  cron: CronForm,
  radioButtonList: RadioButtonList,
}

const AspectInput = props => {
  const Component = Inputs[props.controlType.component]

  return Component ? <Component {...props} /> : null
}

export default AspectInput
