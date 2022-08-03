import React from 'react'
import { number } from 'prop-types'
import useI18n from '../../../../Hooks/i18n/useI18n'
/**
 * Component to render a numbered cell
 */

const NumberCell = ({ value }) => {
  const { formatNumber } = useI18n()
  return <div>{formatNumber(value)}</div>
}

NumberCell.propTypes = {
  /**
    Data for the cell to render
  */
  value: number.isRequired,
}

export default NumberCell
