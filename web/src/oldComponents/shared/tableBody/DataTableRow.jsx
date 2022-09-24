import React from 'react'
import { TableRow } from '@mui/material'
import { withStyles } from '@mui/styles'
import classNames from 'classnames'
import styles from './DataTableRowStyle'

const DataTableRow = ({ classes, className, children, ...restProps }) => (
  <TableRow {...restProps} className={classNames(className, classes.row)}>
    {children}
  </TableRow>
)

export default withStyles(styles)(DataTableRow)
