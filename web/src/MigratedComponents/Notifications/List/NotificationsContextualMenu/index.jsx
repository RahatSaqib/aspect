import React from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router-dom'
import { useIntl } from 'react-intl'

import AspectVertMenu from '../../../AspectVertMenu'
import messages from './messages'

const NotificationsContextualMenu = ({ item: { id } }) => {
  const history = useHistory()
  const { formatMessage } = useIntl()

  const getItemActions = history => [
    {
      icon: 'FaEdit',
      text: formatMessage(messages.editTitle),
      action: () => history.push(`/browse/notification/${id}`),
      disabled: true,
    },
    {
      icon: 'FaCopy',
      text: formatMessage(messages.copyTitle),
      action: () => false,
      disabled: true,
    },
    {
      icon: 'FaEye',
      text: formatMessage(messages.previewTitle),
      action: () => false,
      disabled: true,
    },
    {
      icon: 'FaFileAlt',
      text: formatMessage(messages.viewLogTitle),
      action: () => history.push(`/browse/notification/${id}/history`),
      separator: true,
    },
    {
      icon: 'FaTrash',
      text: formatMessage(messages.deleteTitle),
      action: () => false,
      disabled: true,
    },
  ]
  return <AspectVertMenu actions={getItemActions(history)} />
}

NotificationsContextualMenu.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number,
  }).isRequired,
}

export default NotificationsContextualMenu
