import PropTypes from 'prop-types'
import React from 'react'

import { withStyles } from '@material-ui/core/styles'
import MUITextField from '@material-ui/core/TextField'

const styles = () => ({})

const TextField = ({
  classes,
  errorText,
  errorStyle,
  floatingLabelFixed,
  floatingLabelText,
  helperText,
  hintText,
  ...restProps
}) => (
  <MUITextField
    label={floatingLabelText}
    InputLabelProps={{
      shrink: floatingLabelFixed || undefined,
    }}
    FormHelperTextProps={{
      style: errorStyle,
    }}
    placeholder={hintText}
    error={!!errorText}
    helperText={errorText || helperText}
    {...restProps}
  />
)

TextField.propTypes = {
  classes: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  className: PropTypes.string,
  errorText: PropTypes.node,
  errorStyle: PropTypes.object, // eslint-disable-line
  helperText: PropTypes.string,
  hintText: PropTypes.string,
  floatingLabelFixed: PropTypes.bool,
  floatingLabelText: PropTypes.string,
}
TextField.defaultProps = {
  className: '',
  errorText: '',
  helperText: '',
  hintText: '',
  floatingLabelFixed: false,
  floatingLabelText: '',
}

export default withStyles(styles)(TextField)
