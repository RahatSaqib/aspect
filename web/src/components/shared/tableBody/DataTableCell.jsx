import classNames from 'classnames'
import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import TableCell from '@material-ui/core/TableCell'

import styles from './DataTableRowStyle'

const DataTableCell = ({
  classes: classesMap,
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
      classesMap.cell,
      classesMap[`hidden${hiddenOn}Down`],
      {
        [classesMap.numeric]: numeric,
        [classesMap.small]: small,
      }
    )}
    {...restProps}
  >
    {children}
  </TableCell>
)

export default withStyles(styles)(DataTableCell)
