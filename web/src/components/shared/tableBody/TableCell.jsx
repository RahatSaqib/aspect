import classNames from 'classnames'
import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import MUITableCell from '@material-ui/core/TableCell'

import styles from './TableRowStyle'

const TableCell = ({
  classes: classesMap,
  className,
  children,
  hiddenOn,
  numeric,
  small,
  ...restProps
}) => (
  <MUITableCell
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
  </MUITableCell>
)

export default withStyles(styles)(TableCell)
