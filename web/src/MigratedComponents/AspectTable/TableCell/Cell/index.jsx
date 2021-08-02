import React from 'react'
import { array, bool, func, number, oneOfType, string } from 'prop-types'

/**
 * Component to render a cell
 */

const Cell = ({ render, format: FormatComp, value }) => {
  return FormatComp ? <FormatComp value={value} /> : <div>{render('Cell')}</div>
}

Cell.defaultProps = {
  format: false,
  value: '',
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
}

export default Cell
