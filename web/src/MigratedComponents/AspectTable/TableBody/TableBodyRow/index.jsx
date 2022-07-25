import React from 'react'
import { array, bool, func, oneOfType } from 'prop-types'
import TableCell from '@material-ui/core/TableCell'

import Cell from '../../TableCell/Cell'
import GroupedCell from '../../TableCell/GroupedCell'
import PlaceholderCell from '../../TableCell/PlaceholderCell'

const TableBodyRow = ({ cells, getToggleRowExpandedProps, isExpanded, subRows, onClick }) =>
  cells &&
  cells.map(
    ({
      getCellProps,
      column,
      column: { format = false, translate = false, link = false },
      render,
      isGrouped,
      isAggregated,
      isPlaceholder,
      value,
      row,
    }) => {
      const onClickCell = () => {
        onClick({ column, row, value })
      }
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
              column={column}
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
              onClick={link ? onClickCell : null}
              column={column}
              row={row.original}
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
