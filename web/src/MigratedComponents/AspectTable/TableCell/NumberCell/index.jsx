import React from 'react'
import { number } from 'prop-types'
import { useIntl } from 'react-intl'

/**
 * Component to render a numbered cell
 */

const NumberCell = ({ value }) => {
  const { formatNumber } = useIntl()
  return <div>{formatNumber(value)}</div>
}

NumberCell.propTypes = {
  /**
    Data for the cell to render
  */
  value: number.isRequired,
}

export default NumberCell
