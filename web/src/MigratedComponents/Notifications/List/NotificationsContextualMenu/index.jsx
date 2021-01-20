import React from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router-dom'
import AspectVertMenu from '../../../AspectVertMenu'

const NotificationsContextualMenu = ({ item: { id } }) => {
  const history = useHistory()

  const getItemActions = history => [
    {
      icon: 'FaEdit',
      text: 'Edit',
      action: () => history.push(`/browse/notification/${id}`),
    },
    {
      icon: 'FaCopy',
      text: 'Copy',
      action: () => false,
      disabled: true,
    },
    {
      icon: 'FaEye',
      text: 'Preview',
      action: () => false,
      disabled: true,
    },
    {
      icon: 'FaFileAlt',
      text: 'View Log',
      action: () => history.push(`/browse/notification/${id}/history`),
      separator: true,
    },
    {
      icon: 'FaTrash',
      text: 'Delete',
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
