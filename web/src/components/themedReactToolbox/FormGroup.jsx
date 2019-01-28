import classnames from 'classnames'
import React from 'react'
import FormLabel from '@material-ui/core/FormLabel'
import FormControl from '@material-ui/core/FormControl'
import { withStyles } from '@material-ui/core/styles'

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

const FormGroup = ({
  classes: classesMap,
  className,
  label,
  htmlFor,
  children,
}) => (
  <FormControl className={classnames(classesMap.root, className)}>
    <FormLabel className={classesMap.label}>{label}</FormLabel>
    <div id={htmlFor} className={classnames(classesMap.input)}>
      {children}
    </div>
  </FormControl>
)

export default withStyles(styles)(FormGroup)
