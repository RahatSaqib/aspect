import React from 'react'
import PropTypes from 'prop-types'
import TableCell from '@material-ui/core/TableCell'

import Cell from '../../TableCell/Cell'
import GroupedCell from '../../TableCell/GroupedCell'
import PlaceholderCell from '../../TableCell/PlaceholderCell'

const TableBodyRow = ({
  cells,
  getToggleRowExpandedProps,
  isExpanded,
  subRows,
}) =>
  cells &&
  cells.map(
    ({
      getCellProps,
      column: { format = false },
      render,
      isGrouped,
      isAggregated,
      isPlaceholder,
      value,
    }) => {
      return (
        <TableCell {...getCellProps()}>
          {isGrouped ? (
            <GroupedCell
              format={format}
              getToggleRowExpandedProps={getToggleRowExpandedProps}
              isExpanded={isExpanded}
              render={render}
              subRows={subRows}
              value={value}
            />
          ) : isAggregated ? (
            render('Aggregated')
          ) : isPlaceholder ? (
            <PlaceholderCell />
          ) : (
            <Cell render={render} format={format} value={value} />
          )}
        </TableCell>
      )
    }
  )

TableBodyRow.defaultProps = {
  isExpanded: false,
  subRows: [],
}

TableBodyRow.propTypes = {
  cells: PropTypes.shape({
    column: PropTypes.object,
    getCellProps: PropTypes.func,
    isAggregated: PropTypes.oneOf([PropTypes.number, PropTypes.bool]),
    isGrouped: PropTypes.bool,
    isPlaceholder: PropTypes.bool,
  }).isRequired,
  getToggleRowExpandedProps: PropTypes.func.isRequired,
  isExpanded: PropTypes.bool,
  subRows: PropTypes.oneOf([PropTypes.array]),
}

export default TableBodyRow
