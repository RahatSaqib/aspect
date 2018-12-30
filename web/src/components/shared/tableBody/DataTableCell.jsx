import classNames from 'classnames'
import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import TableCell from '@material-ui/core/TableCell'

import styles from './DataTableRowStyle'

const DataTableCell = ({
  classes,
  className,
  children,
  hiddenOn,
  numeric,
  small,
  ...restProps
}) => (
  <TableCell
    className={classNames(
      className,
      classes.cell,
      classes[`hidden${hiddenOn}Down`],
      {
        [classes.numeric]: numeric,
        [classes.small]: small,
      }
    )}
    {...restProps}
  >
    {children}
  </TableCell>
)

export default withStyles(styles)(DataTableCell)
