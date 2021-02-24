import React from 'react'
import PropTypes from 'prop-types'
import omit from 'lodash/omit'

import FormControl from '@material-ui/core/FormControl'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select'

const AspectSelect = props => {
  const {
    id,
    label,
    className,
    controlType: { options = [] },
  } = props

  const mergedProps = {
    ...omit(props, ['controlType']),
  }

  return (
    <FormControl className={className}>
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select {...mergedProps} labelId={`${id}-label`}>
        {options.map(({ text, value }) => (
          <MenuItem value={value}>{text}</MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

AspectSelect.defaultProps = {
  className: '',
  label: '',
}

AspectSelect.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object,
  ]).isRequired,
  InputProps: PropTypes.oneOfType([PropTypes.object]).isRequired,
  formik: PropTypes.oneOfType([PropTypes.object]).isRequired,
  className: PropTypes.string,
  label: PropTypes.string,
  controlType: PropTypes.objectOf(PropTypes.shape).isRequired,
}
export default AspectSelect
