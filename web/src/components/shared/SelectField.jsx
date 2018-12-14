import PropTypes from 'prop-types'
import React from 'react'
import classNames from 'classnames'

import { withStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import MenuItem from '@material-ui/core/MenuItem'
import InputLabel from '@material-ui/core/InputLabel'
import Input from '@material-ui/core/Input'
import FormHelperText from '@material-ui/core/FormHelperText'
import FormControl from '@material-ui/core/FormControl'

const styles = theme => ({
  label: {
    '&$labelFocused': {
      color: theme.palette.text.secondary,
    },
  },
  labelFocused: {},
  emptyMenuItem: {
    height: 0,
    padding: 0,
  },
  placeholder: {
    color: theme.palette.text.disabled,
  },
  fullWidth: {
    width: '100%',
  },  
})

const SelectField = ({  
  autoWidth,
  classes,
  className,
  errorText,
  floatingLabelFixed,
  floatingLabelText,
  fullWidth,
  helperText,
  hintText,
  value,  
  children,
  onChange,
  ...restProps
}) => (
  <TextField
    select
    margin="normal"    
    label={floatingLabelText}
    value={value}    
    InputLabelProps={{
      shrink: floatingLabelFixed || undefined,
    }}
    className={classNames(classes.root, className)}
    classes={{
      root: classNames({ [classes.fullWidth]: fullWidth }),
    }}
    error={!!errorText}
    helperText={errorText || helperText}
    onChange={onChange}
    {...restProps}
  >
    {!!hintText && (
      <MenuItem value="" className={classes.emptyMenuItem}>
        <span className={classes.placeholder}>{hintText}</span>
      </MenuItem>
    )}
    {children}
  </TextField>
)

SelectField.propTypes = {
  classes: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  className: PropTypes.string,
  error: PropTypes.bool,
  errorText: PropTypes.string,
  floatingLabelFixed: PropTypes.bool,
  floatingLabelText: PropTypes.string,
  fullWidth: PropTypes.bool,
  helperText: PropTypes.string,
  hintText: PropTypes.string,
  value: PropTypes.string,
  children: PropTypes.node.isRequired,
  onChange: PropTypes.func.isRequired,
}

SelectField.defaultProps = {
  className: '',
  helperText: '',
  errorText: '',
  floatingLabelFixed: false,
  floatingLabelText: '',
  fullWidth: false,
  hintText: '',
  value: '',
}

export default withStyles(styles)(SelectField)
