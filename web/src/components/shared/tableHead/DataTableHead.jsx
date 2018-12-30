import _ from 'lodash'
import classNames from 'classnames'
import React, { useCallback } from 'react'
import { withStyles } from '@material-ui/core/styles'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import TableCell from '@material-ui/core/TableCell'
import TableSortLabel from '@material-ui/core/TableSortLabel'
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown'

const styles = theme => {
  const style = {
    cell: {
      fontWeight: theme.typography.latoFontWeightBold,
    },
    clickable: {
      cursor: 'pointer',
    },
    centerAlignedCell: {
      textAlign: 'center',
    },
    compact: {
      height: 12,
      lineHeight: '1em',
      paddingBottom: 0,
      borderBottom: 0,
    },
    sortIcon: {
      fontSize: 24,
      width: '1em',
      height: '1em',
    },
  }
  const hidden = {
    display: 'none',
    visibility: 'hidden',
  }
  return ['xs', 'sm', 'md', 'lg', 'xl'].reduce((acc, key) => {
    acc[`hidden${key}Down`] = {
      [theme.breakpoints.down(key)]: hidden,
    }
    return acc
  }, style)
}

const DataTableHead = ({
  classes,
  compact,
  sortColumnKey,
  sortColumnDir,
  columns,
  onHeadColumnClick,
}) => (
  <TableHead>
    <TableRow className={classNames({ [classes.compact]: compact })}>
      {columns.map(
        (
          {
            key = index,
            colSpan,
            label,
            onClick,
            sortable = false,
            hiddenOn,
            ...restProps
          },
          index
        ) => (
          <TableCell
            key={key}
            data-column={key}
            colSpan={colSpan}
            sortDirection={sortColumnKey === key ? sortColumnDir : false}
            onClick={onClick}
            {...restProps}
            className={classNames(
              restProps.className,
              classes.cell,
              classes[`hidden${hiddenOn}Down`],
              {
                [classes.centerAlignedCell]: !!colSpan,
                [classes.clickable]: _.isFunction(onClick) || sortable,
                [classes.compact]: compact,
              }
            )}
          >
            {!sortable ? (
              label
            ) : (
              <TableSortLabel
                active={sortColumnKey === key}
                direction={sortColumnDir}
                onClick={
                  onHeadColumnClick &&
                  useCallback(() => onHeadColumnClick(key), [
                    key,
                    sortColumnDir,
                    sortColumnKey,
                  ])
                }
                IconComponent={KeyboardArrowDown}
                classes={{
                  icon: classes.sortIcon,
                }}
              >
                {label}
              </TableSortLabel>
            )}
          </TableCell>
        )
      )}
    </TableRow>
  </TableHead>
)

export default withStyles(styles)(DataTableHead)
