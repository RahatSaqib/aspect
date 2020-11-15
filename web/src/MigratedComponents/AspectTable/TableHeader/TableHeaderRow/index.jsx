import React from 'react'
import PropTypes from 'prop-types'
import TableCell from '@material-ui/core/TableCell'

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
        <TableCell
          {...getHeaderProps(getSortByToggleProps(), getGroupByToggleProps())}
          style={{ width: `${width}%` }}
        >
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
                <TableColumnHideButton
                  headerIndex={id}
                  handleHideColumnToggle={handleHideColumnToggle}
                />
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
  allowColumnReOrder: PropTypes.bool.isRequired,
  handleChangeColumnOrder: PropTypes.func.isRequired,
  handleHideColumnToggle: PropTypes.func.isRequired,
  handleGroupByColumnToggle: PropTypes.func.isRequired,
  headers: PropTypes.oneOf([PropTypes.array]).isRequired,
}

export default TableHeaderRow
