import React from 'react'
import { PropTypes } from 'prop-types'
import { useIntl } from 'react-intl'
import get from 'lodash/get'
import messages from '../messages'

const TranslatedCell = ({ value }) => {
  const { formatMessage } = useIntl()
  const message = get(messages, value, value)
  return <div>{message === value ? value : formatMessage(message)}</div>
}

TranslatedCell.defaultProps = {
  value: '',
}

TranslatedCell.propTypes = {
  value: PropTypes.string,
}

export default TranslatedCell
