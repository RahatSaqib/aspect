import React from 'react'
import { FormControl, FormLabel } from '@mui/material'
import { withStyles } from '@mui/styles'
import classnames from 'classnames'

const styles = {
  root: {
    width: '100%',
    margin: '8px 0 20px 0',
  },
  label: {
    fontSize: '0.75rem',
    marginBottom: 6,
  },
  input: {
    borderBottom: 'none',
  },
}

const FormGroup = ({ classes: classNameValues, className, label, htmlFor, children }) => (
  <FormControl className={classnames(classNameValues.root, className)}>
    <FormLabel className={classNameValues.label}>{label}</FormLabel>
    <div id={htmlFor} className={classnames(classNameValues.input)}>
      {children}
    </div>
  </FormControl>
)

export default withStyles(styles)(FormGroup)
