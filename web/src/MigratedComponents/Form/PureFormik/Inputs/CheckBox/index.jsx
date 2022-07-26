import React from 'react'
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormHelperText from '@material-ui/core/FormHelperText'
import Checkbox from '@material-ui/core/Checkbox'
import startCase from 'lodash/startCase'

/**
 * this component should not contain **ANY**
 * new styles, logic or functions
 */

const PureCheckboxInput = props => {
  const { inputProps, form } = props
  const { id, label } = inputProps
  const { errors, touched, handleBlur, handleChange, values } = form
  const isError = touched[id] && Boolean(errors[id])
  return (
    <FormControl>
      <FormControlLabel
        control={<Checkbox id={id} name={id} checked={values[id]} onChange={handleChange} onBlur={handleBlur} />}
        label={label || startCase(id)}
      />
      {isError ? <FormHelperText>{touched[id] && errors[id]}</FormHelperText> : null}
    </FormControl>
  )
}

export default PureCheckboxInput
