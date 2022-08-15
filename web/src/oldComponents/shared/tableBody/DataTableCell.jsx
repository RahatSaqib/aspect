import classNames from 'classnames'
import React from 'react'
import { withStyles } from '@mui/styles'
import TableCell from '@mui/material/TableCell'

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
