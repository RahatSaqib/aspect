import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'

const NumberCell = ({ value }) => {
  const { formatNumber } = useIntl()
  return <div>{formatNumber(value)}</div>
}

NumberCell.propTypes = {
  value: PropTypes.oneOf([PropTypes.array]).isRequired,
}

export default NumberCell
