import classNames from 'classnames'
import React from 'react'
import { withStyles } from '@mui/styles'
import TableRow from '@mui/material/TableRow'

import styles from './DataTableRowStyle'

const DataTableRow = ({ classes, className, children, ...restProps }) => (
  <TableRow {...restProps} className={classNames(className, classes.row)}>
    {children}
  </TableRow>
)

export default withStyles(styles)(DataTableRow)
