import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableHead, TableCell } from 'react-toolbox/lib/table'
import KeyboardArrowUp from 'react-icons/lib/md/keyboard-arrow-up'
import KeyboardArrowDown from 'react-icons/lib/md/keyboard-arrow-down'

const cssClasses = classnames.bind(require('./DataTableHead.css'))

const enhance = _.identity

const DataTableHead = ({ sortColumnKey, sortColumnDir, columns }) =>
  <TableHead className={cssClasses('TableHead')}>
    {columns.map(({ key = index, label, ...restProps }, index) =>
      <TableCell
        key={key}
        data-column={key}
        {...restProps}
        className={cssClasses(restProps.className, 'TableCell')}
      >
        {label}
        {sortColumnKey === key &&
          (sortColumnDir === 'asc'
            ? <KeyboardArrowDown
                className={cssClasses('TableCell__SortIcon')}
              />
            : <KeyboardArrowUp
                className={cssClasses('TableCell__SortIcon')}
              />)}
      </TableCell>
    )}
  </TableHead>

export default enhance(DataTableHead)
