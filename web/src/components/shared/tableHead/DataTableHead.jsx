import isFunction from 'lodash/isFunction'
import noop from 'lodash/noop'
import classNames from 'classnames'
import React from 'react'
import { withStyles } from '@material-ui/styles'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import TableCell from '@material-ui/core/TableCell'
import TableSortLabel from '@material-ui/core/TableSortLabel'
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown'
import PermissionsProvider from '../../../Providers/PermissionsProvider'
import AspectTooltip from '../AspectTooltip'

const styles = theme => {
  const style = {
    cell: {
      fontWeight: theme.typography.fontWeightBold,
      whiteSpace: 'nowrap',
    },
    columnLabel: {
      whiteSpace: 'normal',
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
    tooltipIcon: {
      display: 'inline-flex',
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
  onHeadColumnClick = noop,
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
            tooltip,
            isHidden,
            hiddenOn,
            auth,
            ...restProps
          },
          index
        ) =>
          !isHidden ? (
            <PermissionsProvider
              key={`PermissionProvider--${key}`}
              permissions={auth || []}
            >
              <TableCell
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
                    [classes.clickable]: isFunction(onClick) || sortable,
                    [classes.compact]: compact,
                  }
                )}
              >
                {!sortable ? (
                  <span className={classes.columnLabel}>{label}</span>
                ) : (
                  <TableSortLabel
                    active={sortColumnKey === key}
                    direction={sortColumnDir}
                    onClick={() => onHeadColumnClick(key)}
                    IconComponent={KeyboardArrowDown}
                    classes={{
                      root: classes.columnLabel,
                      icon: classes.sortIcon,
                    }}
                  >
                    {label}
                  </TableSortLabel>
                )}
                {tooltip && (
                  <AspectTooltip
                    title={tooltip}
                    showHelpIcon
                    toolTipContainerClass={classes.tooltipIcon}
                  />
                )}
              </TableCell>
            </PermissionsProvider>
          ) : null
      )}
    </TableRow>
  </TableHead>
)
export default withStyles(styles)(DataTableHead)
