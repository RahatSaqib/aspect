import React from 'react'

import AspectTextField from './TextField'
import AspectTextArea from './TextArea'

const Inputs = {
  textArea: AspectTextArea,
  textField: AspectTextField,
}

const AspectInput = props => {
  const Component = Inputs[props.controlType]
  return Component ? <Component {...props} /> : null
}

export default AspectInput
