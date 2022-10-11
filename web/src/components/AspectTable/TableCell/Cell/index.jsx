import React from 'react'
import { Button } from '@mui/material'
import { array, bool, func, object, oneOfType, number, string } from 'prop-types'

/**
 * Component to render a cell
 */

const CellValue = ({ format: FormatComp, render, translate, value, row: item }) => {
  return FormatComp ? (
    <FormatComp value={value} item={item} />
  ) : (
    <div>{translate ? render(({ value }) => translate(value)) : render('Cell')}</div>
  )
}

const Cell = ({ onClick, ...restProps }) => {
  return onClick ? (
    <Button onClick={onClick}>
      <CellValue {...restProps} />
    </Button>
  ) : (
    <CellValue {...restProps} />
  )
}

Cell.defaultProps = {
  format: false,
  value: '',
  translate: false,
  onClick: null,
  column: null,
}

Cell.propTypes = {
  /**
    Function exposed by react-table
  */
  render: func.isRequired,
  /**
    Function to apply format to cell
  */
  format: oneOfType([bool, func]),
  /**
    Data for the cell to render
  */
  value: oneOfType([array, string, number]),
  /**
    Translate function
  */
  translate: oneOfType([bool, func]),
  /**
    Handler for clickable cell
   */
  onClick: func,
  /**
    Definitions of cell column
   */
  column: oneOfType([object, func]),
}

export default Cell
