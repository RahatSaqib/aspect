import React, { Fragment, useState } from 'react'
import PropTypes from 'prop-types'
import { useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import AspectVertMenu from '../../../../components/AspectVertMenu'
import { NOTIFICATION_LIST } from '../../../../components/QueryFetch/Notification/index'
import useI18n from '../../../../hooks/useI18n'
import DeleteConfirmationModal from './DeleteConfirmationModal'
import messages from './messages'
import ToggleStatusConfirmationModal from './ToggleStatusConfirmationModal'

const initialToggleStatus = { showDialog: false, notificationId: 0, notificationEnabled: false }

const initialDeleteStatus = { showDialog: false, notificationId: 0 }

const NotificationsContextualMenu = ({ item }) => {
  const navigate = useNavigate()
  const { formatMessage } = useI18n()

  const { id, readyForNotification, name, enabled, totalTriggers } = item

  const queryClient = useQueryClient()
  const refreshList = () => {
    queryClient.invalidateQueries(NOTIFICATION_LIST.KEY)
  }

  const [toggleStatusNotificationModalConfig, setToggleStatusNotificationModalConfig] = useState(initialToggleStatus)

  const [deleteNotificationModalConfig, setDeleteNotificationModalConfig] = useState(initialDeleteStatus)

  const getItemActions = navigate => [
    {
      icon: 'FaEdit',
      text: formatMessage(messages.editTitle),
      action: () => navigate(`/browse/notification/${id}`),
      disabled: !readyForNotification,
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
          setToggleStatusNotificationModalConfig(initialToggleStatus)
          refreshList()
        }}
      />
      <DeleteConfirmationModal
        {...deleteNotificationModalConfig}
        onClose={() => {
          setDeleteNotificationModalConfig(initialDeleteStatus)
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
    readyForNotification: PropTypes.number,
    name: PropTypes.string,
    enabled: PropTypes.number,
    typeCategory: PropTypes.string,
    totalTriggers: PropTypes.number,
  }).isRequired,
}

export default NotificationsContextualMenu
