import React from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { useIntl } from 'react-intl'

import { useMutation } from 'react-query'
import AspectVertMenu from '../../../AspectVertMenu'
import messages from './messages'
import fetchWrapperForQueries from '../../../QueryFetch/index'
import { NOTIFICATION_DELETE } from '../../../QueryFetch/Notification/index'

const NotificationsContextualMenu = ({ item }) => {
  const navigate = useNavigate()
  const { formatMessage } = useIntl()
  const { id, typeCategory, totalTriggers } = item
  const { mutate: deleteNotification } = useMutation(
    ({ id }) => {
      const endpoint = `${NOTIFICATION_DELETE.ENDPOINT}${id}`

      return fetchWrapperForQueries({
        endpoint,
        method: 'DELETE',
      })
    },
    {
      onSuccess: () => {
        navigate(`/browse/notification`)
      },
    }
  )
  const getItemActions = navigate => [
    {
      icon: 'FaEdit',
      text: formatMessage(messages.editTitle),
      action: () => navigate(`/browse/notification/${id}`),
      disabled: typeCategory !== 'resultBased',
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
      action: () => deleteNotification({ id }),
      disabled: totalTriggers > 0,
    },
  ]
  return <AspectVertMenu actions={getItemActions(navigate)} />
}

NotificationsContextualMenu.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    typeCategory: PropTypes.string,
    totalTriggers: PropTypes.number,
  }).isRequired,
}

export default NotificationsContextualMenu
