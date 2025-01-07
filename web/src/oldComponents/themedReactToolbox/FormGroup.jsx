import React from 'react'
import { FormControl, FormLabel, FormHelperText } from '@mui/material'
import { withStyles } from '@mui/styles'
import classnames from 'classnames'

const styles = {
  root: {
    width: '100%',
    margin: '8px 0 20px 0',
  },
  labelWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: '0.75rem',
    marginBottom: 6,
  },
  input: {
    borderBottom: 'none',
  },
  error: {
    marginTop: 0,
    marginRight: 0,
    lineHeight: '1.4375em',
    marginBottom: '6px',
  },
}

const FormGroup = ({
  classes: classNameValues,
  className,
  label,
  htmlFor,
  children,
  labelProps,
  error,
  helperText,
}) => (
  <FormControl className={classnames(classNameValues.root, className)}>
    <div className={classNameValues.labelWrapper}>
      <FormLabel className={classNameValues.label} {...labelProps}>
        {label}
      </FormLabel>
      {error && helperText ? (
        <FormHelperText error className={classNameValues.error}>
          {helperText}
        </FormHelperText>
      ) : null}
    </div>
    <div id={htmlFor} className={classnames(classNameValues.input)}>
      {children}
    </div>
  </FormControl>
)

export default withStyles(styles)(FormGroup)
