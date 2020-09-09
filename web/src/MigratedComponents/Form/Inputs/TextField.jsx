import React, { Fragment } from 'react'
import TextField from '@material-ui/core/TextField'

import FormHTMLLabel from '../FormHTMLLabel'

const AspectTextField = props => (
  <TextField
    {...props}
    label={<FormHTMLLabel label={props.label} link={props.link} />}
  />
)

export default AspectTextField
