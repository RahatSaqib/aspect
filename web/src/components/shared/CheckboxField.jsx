import PropTypes from 'prop-types'
import React from 'react'

import { withStyles } from '@material-ui/core/styles'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Checkbox from '@material-ui/core/Checkbox'
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank'
import CheckBoxIcon from '@material-ui/icons/CheckBox'

const styles = () => ({
  root: {
    marginLeft: 0,
  },
  label: {
    fontSize: '1em',
    lineHeight: '24px',
  },
  checkbox: {
    marginRight: 16,
    padding: '10px 0',
  },
  icon: {
    fontSize: 24,
  },
})

const CheckboxField = ({ classes, label, ...restProps }) => (
  <FormControlLabel
    classes={{
      root: classes.root,
      label: classes.label,
    }}
    control={
      <Checkbox
        classes={{ root: classes.checkbox }}
        icon={<CheckBoxOutlineBlankIcon classes={{ root: classes.icon }} />}
        checkedIcon={<CheckBoxIcon classes={{ root: classes.icon }} />}
        {...restProps}
      />
    }
    label={label}
  />
)

CheckboxField.propTypes = {
  classes: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  label: PropTypes.string.isRequired,
}

export default withStyles(styles)(CheckboxField)
