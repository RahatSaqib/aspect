import PropTypes from 'prop-types'
import React from 'react'
import classNames from 'classnames'

import { withStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import MenuItem from '@material-ui/core/MenuItem'

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
  classes: classesMap,
  className,
  errorText,
  errorStyle,
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
    InputLabelProps={{
      shrink: floatingLabelFixed || undefined,
    }}
    FormHelperTextProps={{
      style: errorStyle,
    }}
    SelectProps={{
      autoWidth: true,
      displayEmpty: true,
      value,
    }}
    className={classNames(classesMap.root, className)}
    classes={{
      root: classNames({ [classesMap.fullWidth]: fullWidth }),
    }}
    error={!!errorText}
    helperText={errorText || helperText}
    onChange={onChange}
    {...restProps}
  >
    {!!hintText && (
      <MenuItem value="" className={classesMap.emptyMenuItem}>
        <span className={classesMap.placeholder}>{hintText}</span>
      </MenuItem>
    )}
    {children}
  </TextField>
)

SelectField.propTypes = {
  autoWidth: PropTypes.bool,
  classes: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  className: PropTypes.string,
  errorText: PropTypes.node,
  errorStyle: PropTypes.object, // eslint-disable-line
  floatingLabelFixed: PropTypes.bool,
  floatingLabelText: PropTypes.string,
  fullWidth: PropTypes.bool,
  helperText: PropTypes.string,
  hintText: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
    PropTypes.object,
  ]), // eslint-disable-line
  children: PropTypes.node.isRequired,
  onChange: PropTypes.func.isRequired,
}

SelectField.defaultProps = {
  autoWidth: true,
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
