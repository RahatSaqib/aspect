import React from 'react'

import AspectTextField from './TextField'
import AspectTextArea from './TextArea'
import { AspectDatePicker, AspectDateTimePicker } from './DatePicker'
import AspectSelectDropdown from './SelectDropdown'

const Inputs = {
  textArea: AspectTextArea,
  textField: AspectTextField,
  datePicker: AspectDatePicker,
  dateTimePicker: AspectDateTimePicker,
  selectDropDown: AspectSelectDropdown,
}

const AspectInput = props => {
  const Component = Inputs[props.controlType]
  return Component ? <Component {...props} /> : null
}

export default AspectInput
