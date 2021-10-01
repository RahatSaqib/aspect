import React from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { useIntl } from 'react-intl'

import AspectVertMenu from '../../../AspectVertMenu'
import messages from './messages'

const NotificationsContextualMenu = ({ item: { id } }) => {
  const navigate = useNavigate()
  const { formatMessage } = useIntl()

  const getItemActions = navigate => [
    {
      icon: 'FaEdit',
      text: formatMessage(messages.editTitle),
      action: () => navigate(`/browse/notification/${id}`),
      // disabled: true,
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
      action: () => navigate(`/browse/notification/${id}/history`),
      separator: true,
    },
    {
      icon: 'FaTrash',
      text: formatMessage(messages.deleteTitle),
      action: () => false,
      disabled: true,
    },
  ]
  return <AspectVertMenu actions={getItemActions(navigate)} />
}

NotificationsContextualMenu.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
}

export default NotificationsContextualMenu
