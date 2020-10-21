import React from 'react'
import PropTypes from 'prop-types'
import TableSortLabel from '@material-ui/core/TableSortLabel'
import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('../Table.css'))

function TableColumnHeader({
  canSort,
  isSorted,
  isSortedDesc,
  headerOrderComponent: HeaderOrderComponent,
  render,
}) {
  return (
    <div className={cssClasses('table__container')}>
      <div className={cssClasses('table__header')}>
        <TableSortLabel
          active={isSorted}
          direction={isSortedDesc ? 'desc' : 'asc'}
          hideSortIcon
          className={cssClasses(
            `${canSort ? 'table__headerLabel' : 'table__headerLabel--nohover'}`
          )}
        >
          <div
            className={cssClasses(
              `${
                isSorted
                  ? 'table__headerTitle table__headerTitle--bold'
                  : 'table__headerTitle'
              }`
            )}
          >
            {render}
          </div>
        </TableSortLabel>
      </div>
      <HeaderOrderComponent />
    </div>
  )
}

TableColumnHeader.defaultProps = {
  isSortedDesc: false,
}

TableColumnHeader.propTypes = {
  canSort: PropTypes.bool.isRequired,
  isSorted: PropTypes.bool.isRequired,
  isSortedDesc: PropTypes.bool,
  headerOrderComponent: PropTypes.func.isRequired,
  render: PropTypes.string.isRequired,
}

export default TableColumnHeader
