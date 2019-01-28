import classNames from 'classnames'
import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import TableRow from '@material-ui/core/TableRow'

import styles from './DataTableRowStyle'

const DataTableRow = ({
  classes: classesMap,
  className,
  children,
  ...restProps
}) => (
  <TableRow {...restProps} className={classNames(className, classesMap.row)}>
    {children}
  </TableRow>
)

export default withStyles(styles)(DataTableRow)
