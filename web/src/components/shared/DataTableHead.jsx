import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers } from 'recompose'
import { TableHead, TableCell } from 'react-toolbox/lib/table'
import KeyboardArrowUp from 'react-icons/lib/md/keyboard-arrow-up'
import KeyboardArrowDown from 'react-icons/lib/md/keyboard-arrow-down'

const cssClasses = classnames.bind(require('./DataTableHead.css'))

const enhance = compose(
  withHandlers({
    onHeadColumnClick: ({ onSortColumn = _.noop }) => ({
      currentTarget: { dataset: { column: nextSortCol } },
    }) => {
      onSortColumn(nextSortCol)
    },
  })
)

const DataTableHead = ({
  compact,
  sortColumnKey,
  sortColumnDir,
  columns,
  onHeadColumnClick,
}) => (
  <TableHead
    className={cssClasses('TableHead', {
      'TableHead--compact': compact,
    })}
  >
    {columns.map(
      ({ key = index, label, onClick, sortable, ...restProps }, index) => (
        <TableCell
          key={key}
          data-column={key}
          onClick={onClick || (sortable && onHeadColumnClick)}
          {...restProps}
          className={cssClasses(restProps.className, 'TableCell', {
            'TableCell--clickable': _.isFunction(onClick) || sortable,
          })}
        >
          {label}
          {sortColumnKey === key &&
            (sortColumnDir === 'asc' ? (
              <KeyboardArrowDown
                className={cssClasses('TableCell__SortIcon')}
              />
            ) : (
              <KeyboardArrowUp className={cssClasses('TableCell__SortIcon')} />
            ))}
        </TableCell>
      )
    )}
  </TableHead>
)

export default enhance(DataTableHead)
