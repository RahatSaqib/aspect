import React from 'react'
import { TableCell } from '@mui/material'
import { withStyles } from '@mui/styles'
import classNames from 'classnames'
import styles from './DataTableRowStyle'

const DataTableCell = ({ classes, className, children, hiddenOn, numeric, small, ...restProps }) => (
  <TableCell
    className={classNames(className, classes.cell, classes[`hidden${hiddenOn}Down`], {
      [classes.numeric]: numeric,
      [classes.small]: small,
    })}
    {...restProps}
  >
    {children}
  </TableCell>
)

export default withStyles(styles)(DataTableCell)
