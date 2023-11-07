import React, { useEffect, useState } from 'react'
import { MenuItem, TextField } from '@mui/material'
import { withStyles } from '@mui/styles'
import classNames from 'classnames'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import PropTypes from 'prop-types'

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
    overflow: 'hidden',
  },
  placeholder: {
    color: theme.palette.text.disabled,
  },
  fullWidth: {
    width: '100%',
  },
})

const getSelectedValue = (value, children, multiple) => {
  const emptyValue = multiple ? [] : ''
  let normalizedValue = value
  if (multiple) {
    normalizedValue = isArray(value) ? value : [value]
  }

  const noChildren = React.Children.count(children) === 0
  /** list of MenuItem's contain 'value' */
  const containsValue = React.Children.toArray(children).find(menuItem => {
    if (multiple) {
      return normalizedValue.includes(!!menuItem && menuItem.props && menuItem.props.value)
    }

    return !!menuItem && menuItem.props && menuItem.props.value === normalizedValue
  })
  return noChildren || !containsValue ? emptyValue : normalizedValue
}

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
  multiple,
  ...restProps
}) => {
  const [selectedValue, setSelectedValue] = useState(getSelectedValue(value, children, multiple))

  useEffect(() => {
    const newValue = getSelectedValue(value, children, multiple)
    setSelectedValue(newValue)
  }, [children, multiple, value])

  return (
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
        autoWidth,
        displayEmpty: true,
        multiple,
        value: selectedValue,
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
      {!isEmpty(hintText) ? (
        <MenuItem value="" className={classesMap.emptyMenuItem}>
          <span className={classesMap.placeholder}>{hintText}</span>
        </MenuItem>
      ) : null}
      {children}
    </TextField>
  )
}

SelectField.propTypes = {
  autoWidth: PropTypes.bool,
  classes: PropTypes.oneOfType([PropTypes.object]).isRequired,
  className: PropTypes.string,
  errorText: PropTypes.node,
  errorStyle: PropTypes.object, // eslint-disable-line
  floatingLabelFixed: PropTypes.bool,
  floatingLabelText: PropTypes.string,
  fullWidth: PropTypes.bool,
  helperText: PropTypes.node,
  hintText: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
    PropTypes.object,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  children: PropTypes.node,
  onChange: PropTypes.func.isRequired,
  multiple: PropTypes.bool,
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
  children: null,
  multiple: false,
}

export default withStyles(styles)(SelectField)
