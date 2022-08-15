import React from 'react'
import { bool, func, oneOfType, array } from 'prop-types'
import TableCell from '@mui/material/TableCell'

import TableColumnHeader from '../TableColumnHeader'
import TableColumnOrderButtons from '../TableColumnOrderButtons'
import TableColumnGroupBy from '../TableColumnGroupBy'
import TableColumnHideButton from '../TableColumnHideButton'

const TableHeaderRow = ({
  allowColumnReOrder,
  handleChangeColumnOrder,
  handleHideColumnToggle,
  handleGroupByColumnToggle,
  headers,
}) =>
  headers &&
  headers.map(
    (
      {
        canSort,
        canGroupBy,
        disableHide,
        getHeaderProps,
        getGroupByToggleProps,
        getSortByToggleProps,
        id,
        isGrouped,
        isSorted,
        isSortedDesc,
        render,
        width,
      },
      index
    ) => {
      return (
        <TableCell {...getHeaderProps(getSortByToggleProps(), getGroupByToggleProps())} style={{ width: `${width}%` }}>
          <TableColumnHeader
            width={width}
            render={render('Header')}
            canSort={canSort}
            canGroupBy={canGroupBy}
            isSorted={isSorted}
            isSortedDesc={isSortedDesc}
            headerOrderComponent={() =>
              allowColumnReOrder ? (
                <TableColumnOrderButtons
                  headerIndex={index}
                  headersLength={headers.length}
                  handleChangeColumnOrder={handleChangeColumnOrder}
                />
              ) : null
            }
            headerVisibilityComponent={() =>
              !disableHide ? (
                <TableColumnHideButton headerIndex={id} handleHideColumnToggle={handleHideColumnToggle} />
              ) : null
            }
            headerGroupByComponent={() =>
              canGroupBy ? (
                <TableColumnGroupBy
                  headerIndex={id}
                  handleGroupByColumnToggle={handleGroupByColumnToggle}
                  isGrouped={isGrouped}
                />
              ) : null
            }
          />
        </TableCell>
      )
    }
  )

TableHeaderRow.propTypes = {
  headers: false,
}

TableHeaderRow.propTypes = {
  /**
    Boolean to allow column reordering
  */
  allowColumnReOrder: bool.isRequired,
  /**
    Function to handle column reorder
  */
  handleChangeColumnOrder: func.isRequired,
  /**
    Function to handle column visibility
  */
  handleHideColumnToggle: func.isRequired,
  /**
    Function to handle column grouping
  */
  handleGroupByColumnToggle: func.isRequired,
  /**
    Array of column titles, bool while waiting for data
  */
  headers: oneOfType([array, bool]).isRequired,
}

export default TableHeaderRow
