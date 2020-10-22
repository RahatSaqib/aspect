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
  headerVisibilityComponent: HeaderVisibilityComponent,
  render,
  toggleHidden,
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
      <div className={cssClasses('tablecolumn__actions')}>
        <HeaderVisibilityComponent onClick={toggleHidden} />
        <HeaderOrderComponent />
      </div>
    </div>
  )
}

TableColumnHeader.defaultProps = {
  isSortedDesc: false,
}

TableColumnHeader.propTypes = {
  canSort: PropTypes.bool.isRequired,
  headerOrderComponent: PropTypes.func.isRequired,
  headerVisibilityComponent: PropTypes.func.isRequired,
  isSorted: PropTypes.bool.isRequired,
  isSortedDesc: PropTypes.bool,
  toggleHidden: PropTypes.bool.isRequired,
  render: PropTypes.string.isRequired,
}

export default TableColumnHeader
