import classNames from 'classnames'
import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import MUITableRow from '@material-ui/core/TableRow'

import styles from './TableRowStyle'

const TableRow = ({
  classes: classesMap,
  className,
  children,
  ...restProps
}) => (
  <MUITableRow {...restProps} className={classNames(className, classesMap.row)}>
    {children}
  </MUITableRow>
)

export default withStyles(styles)(TableRow)
