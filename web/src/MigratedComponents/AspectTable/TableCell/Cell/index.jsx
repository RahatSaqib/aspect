import React from 'react'
import { array, bool, func, number, oneOfType, string } from 'prop-types'

/**
 * Component to render a cell
 */

const Cell = ({ render, format: FormatComp, value, translate }) => {
  return FormatComp ? (
    <FormatComp value={value} />
  ) : (
    <div>
      {translate ? render(({ value }) => translate(value)) : render('Cell')}
    </div>
  )
}

Cell.defaultProps = {
  format: false,
  value: '',
  translate: false,
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
}

export default Cell
