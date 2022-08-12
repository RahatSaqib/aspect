import React from 'react'
import { number, oneOfType, bool, string } from 'prop-types'
import { defineMessages } from 'react-intl'

import useI18n from '../../../../hooks/useI18n'

const messages = defineMessages({
  yes: {
    id: 'pages.NotificationList.yes',
    defaultMessage: 'Yes',
  },
  no: {
    id: 'pages.NotificationList.no',
    defaultMessage: 'No',
  },
})

const getDisplayValue = (value, formatMessage) => {
  switch (`${value}`.toUpperCase()) {
    case 'TRUE':
    case '1':
    case 'Y':
    case 'YES':
      return formatMessage(messages.yes)
    default:
      return formatMessage(messages.no)
  }
}

const BooleanCell = ({ value }) => {
  const { formatMessage } = useI18n()
  const text = getDisplayValue(value, formatMessage)
  return <div>{text}</div>
}

BooleanCell.propTypes = {
  value: oneOfType([number, string, bool]).isRequired,
}

export default BooleanCell
