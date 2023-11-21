import React from 'react'
import { TableSortLabel } from '@mui/material'
import { bool, func, string } from 'prop-types'
import styles from '../../Table.module.css'

/**
 * Component to render column
 */

function TableColumnHeader({
  canSort,
  isSorted,
  isSortedDesc,
  headerGroupByComponent: HeaderGroupByComponent,
  headerOrderComponent: HeaderOrderComponent,
  headerVisibilityComponent: HeaderVisibilityComponent,
  render,
}) {
  return (
    <div className={styles.table__container}>
      <div className={styles.table__header}>
        <TableSortLabel
          active={isSorted}
          direction={isSortedDesc ? 'desc' : 'asc'}
          hideSortIcon
          className={`${canSort ? styles.table__headerLabel : styles.table__headerLabel__nohover}`}
        >
          <div
            className={`${
              isSorted ? [styles.table__headerTitle, styles.table__headerTitle__bold] : styles.table__headerTitle
            }`}
          >
            {render}
          </div>
        </TableSortLabel>
      </div>
      <div className={styles.tablecolumn__actions}>
        <HeaderGroupByComponent />
        <HeaderVisibilityComponent />
        <HeaderOrderComponent />
      </div>
    </div>
  )
}

TableColumnHeader.defaultProps = {
  isSortedDesc: false,
}

TableColumnHeader.propTypes = {
  /**
    Boolean to allow table row order toggle
  */
  canSort: bool.isRequired,
  /**
    Function exposed by react-table
  */
  headerGroupByComponent: func.isRequired,
  /**
    Function exposed by react-table
  */
  headerOrderComponent: func.isRequired,
  /**
    Function exposed by react-table
  */
  headerVisibilityComponent: func.isRequired,
  /**
    Boolean to check if rows are sorted by this column
  */
  isSorted: bool.isRequired,
  /**
    Bool to identify direction of sorting
  */
  isSortedDesc: bool,
  /**
    Function exposed by react-table
  */
  render: string.isRequired,
}

export default TableColumnHeader
