import PropTypes from 'prop-types'
import React from 'react'

import { withStyles } from '@material-ui/core/styles'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import AspectCheckbox from '../../components/shared/AspectCheckbox'

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
    marginRight: 12,
    padding: '10px 0',
  },
  icon: {
    fontSize: 24,
  },
}

const CheckboxField = ({
  classes: classesMap,
  className,
  label,
  ...restProps
}) => (
  <FormControlLabel
    classes={{
      root: classesMap.root,
      label: classesMap.label,
    }}
    className={className}
    control={
      <AspectCheckbox classes={{ root: classesMap.checkbox }} {...restProps} />
    }
    label={label}
  />
)

CheckboxField.propTypes = {
  classes: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  className: PropTypes.string,
  label: PropTypes.string.isRequired,
}

CheckboxField.defaultProps = {
  className: '',
}

export default withStyles(styles)(CheckboxField)
