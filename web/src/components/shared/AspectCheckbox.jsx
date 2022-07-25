import classNames from 'classnames'
import React from 'react'
import Checkbox from '@material-ui/core/Checkbox'
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank'
import CheckBoxIcon from '@material-ui/icons/CheckBox'

const AspectCheckbox = ({ autoWidth, className, size = 'medium', color = 'primary', ...restProps }) => (
  <Checkbox
    className={classNames(className)}
    color={color}
    icon={<CheckBoxOutlineBlankIcon />}
    checkedIcon={<CheckBoxIcon />}
    size={size}
    {...restProps}
  />
)

export default AspectCheckbox
