import React from 'react'
import { FormControlLabel } from '@mui/material'
import { withStyles } from '@mui/styles'
import PropTypes from 'prop-types'
import AspectCheckbox from './AspectCheckbox'

const styles = {
  root: {
    marginLeft: 0,
    marginRight: 0,
  },
  label: {
    fontSize: '1em',
    lineHeight: '24px',
  },
  checkbox: {
    marginRight: 1,
  },
  icon: {
    fontSize: 24,
  },
}

const CheckboxField = ({ classes: classesMap, className, classNames, label, ...restProps }) => (
  <FormControlLabel
    classes={{
      root: classesMap.root,
      label: classesMap.label,
    }}
    className={className}
    control={
      <AspectCheckbox classes={{ root: classesMap.checkbox }} className={classNames.controlContainer} {...restProps} />
    }
    label={label}
  />
)

CheckboxField.propTypes = {
  classes: PropTypes.objectOf(PropTypes.shape),
  className: PropTypes.string,
  classNames: PropTypes.objectOf(PropTypes.shape),
  label: PropTypes.string.isRequired,
}

CheckboxField.defaultProps = {
  className: '',
  classNames: {},
  classes: {},
}

export default withStyles(styles)(CheckboxField)
