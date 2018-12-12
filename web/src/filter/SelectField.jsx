import PropTypes from 'prop-types'
import React from 'react'
import classNames from 'classnames'

import { withStyles } from '@material-ui/core/styles'
import Select from '@material-ui/core/Select'
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
  selectMenu: {
    paddingTop: 0,
    paddingBottom: 0,
  },
})

const SelectField = ({
  className,
  classes,
  value,
  floatingLabelText,
  floatingLabelFixed,
  hintText,
  errorText,
  onChange,
  children,
  ...restProps
}) => (
  <FormControl className={classNames(classes.root, className)} margin="normal">
    <InputLabel
      htmlFor="country-selector"
      shrink={floatingLabelFixed}
      FormLabelClasses={{
        root: classes.label,
        focused: classes.labelFocused,
      }}
    >
      {floatingLabelText}
    </InputLabel>
    <Select
      value={value}
      onChange={onChange}
      name="country"
      input={<Input name="country" id="country-selector" />}
      displayEmpty
      inputProps={{
        placeholder: hintText,
      }}
      {...restProps}
    >
      <MenuItem value="" className={classes.emptyMenuItem}>
        <span className={classes.placeholder}>{hintText}</span>
      </MenuItem>
      {children}
    </Select>
    {errorText && <FormHelperText error>{errorText}</FormHelperText>}
  </FormControl>
)

SelectField.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  floatingLabelText: PropTypes.string,
  floatingLabelFixed: PropTypes.bool,
  hintText: PropTypes.string,
  errorText: PropTypes.string,
  className: PropTypes.string,
  classes: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  children: PropTypes.node.isRequired,
}

SelectField.defaultProps = {
  className: '',
  value: '',
  floatingLabelText: '',
  floatingLabelFixed: false,
  hintText: '',
  errorText: '',
}

export default withStyles(styles)(SelectField)
