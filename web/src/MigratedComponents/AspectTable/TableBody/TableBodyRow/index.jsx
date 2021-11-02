import React from 'react'
import { array, bool, func, oneOfType } from 'prop-types'
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
      column: { format = false, translate = false },
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
            <Cell
              render={render}
              format={format}
              value={value}
              translate={translate}
            />
          )}
        </TableCell>
      )
    }
  )

TableBodyRow.defaultProps = {
  cells: false,
  isExpanded: false,
  subRows: [],
}

TableBodyRow.propTypes = {
  /**
    Array of cells, bool while waiting for data
  */
  cells: oneOfType([array, bool]),
  /**
    Function to handle grouped row toggle
  */
  getToggleRowExpandedProps: func.isRequired,
  /**
    Boolean to indicate if expanded 
  */
  isExpanded: bool,
  /**
    Array for grouped cell sub-rows
  */
  subRows: oneOfType([array]),
}

export default TableBodyRow
