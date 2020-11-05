import React from 'react'
import PropTypes from 'prop-types'

const Cell = ({ render, format: FormatComp, value }) => {
  return FormatComp ? <FormatComp value={value} /> : <div>{render('Cell')}</div>
}

Cell.propTypes = {
  render: PropTypes.func.isRequired,
  format: PropTypes.func.isRequired,
  value: PropTypes.oneOf([PropTypes.array, PropTypes.string, PropTypes.number])
    .isRequired,
}

export default Cell
