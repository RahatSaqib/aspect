import React from 'react'

import AspectTextField from './TextField'
import AspectTextArea from './TextArea'
import { AspectDatePicker, AspectDateTimePicker } from './DatePicker'

const Inputs = {
  textArea: AspectTextArea,
  textField: AspectTextField,
  datePicker: AspectDatePicker,
  dateTimePicker: AspectDateTimePicker,
}

const AspectInput = props => {
  const Component = Inputs[props.controlType.component]
  return Component ? <Component {...props} /> : null
}

export default AspectInput
