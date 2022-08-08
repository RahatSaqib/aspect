import React, { Fragment, useState } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from 'react-query'
import AspectVertMenu from '../../../AspectVertMenu'
import messages from './messages'
import DeleteConfirmationModal from './DeleteConfirmationModal'
import { NOTIFICATION_LIST } from '../../../QueryFetch/Notification/index'
import ToggleStatusConfirmationModal from './ToggleStatusConfirmationModal'
import useI18n from '../../../../Hooks/i18n/useI18n'

const NotificationsContextualMenu = ({ item }) => {
  const navigate = useNavigate()
  const { formatMessage } = useI18n()
  const { id, typeCategory, name, enabled, totalTriggers } = item
  const queryClient = useQueryClient()
  const refreshList = () => {
    queryClient.invalidateQueries(NOTIFICATION_LIST.KEY)
  }

  const [toggleStatusNotificationModalConfig, setToggleStatusNotificationModalConfig] = useState({
    showDialog: false,
    notificationId: 0,
    notificationEnabled: false,
  })

  const [deleteNotificationModalConfig, setDeleteNotificationModalConfig] = useState({
    showDialog: false,
    notificationId: 0,
  })

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
      icon: enabled ? 'BsToggleOn' : 'BsToggleOff',
      text: enabled ? formatMessage(messages.disableStatusTitle) : formatMessage(messages.enableStatusTitle),
      action: () =>
        setToggleStatusNotificationModalConfig({
          notificationId: id,
          notificationName: name,
          notificationEnabled: enabled,
          showDialog: true,
        }),
    },
    {
      icon: 'FaTrash',
      text: formatMessage(messages.deleteTitle),
      color: 'red',
      action: () =>
        setDeleteNotificationModalConfig({
          notificationId: id,
          notificationName: name,
          showDialog: true,
        }),
      disabled: totalTriggers > 0,
    },
  ]
  return (
    <Fragment>
      <ToggleStatusConfirmationModal
        {...toggleStatusNotificationModalConfig}
        onClose={() => {
          setToggleStatusNotificationModalConfig({})
          refreshList()
        }}
      />
      <DeleteConfirmationModal
        {...deleteNotificationModalConfig}
        onClose={() => {
          setDeleteNotificationModalConfig({})
          refreshList()
        }}
      />
      <AspectVertMenu actions={getItemActions(navigate)} />
    </Fragment>
  )
}

NotificationsContextualMenu.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    typeCategory: PropTypes.string,
    name: PropTypes.string,
    enabled: PropTypes.number,
    totalTriggers: PropTypes.number,
  }).isRequired,
}

export default NotificationsContextualMenu
