import React, { Fragment, useState } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from 'react-query'
import AspectVertMenu from '../../../AspectVertMenu'
import messages from './messages'
import DeleteConfirmationModal from './DeleteConfirmationModal'
import { NOTIFICATION_LIST } from '../../../QueryFetch/Notification/index'
import useI18n from '../../../../Hooks/i18n/useI18n'

const NotificationsContextualMenu = ({ item }) => {
  const navigate = useNavigate()
  const { formatMessage } = useI18n()
  const { id, typeCategory, name, totalTriggers } = item
  const queryClient = useQueryClient()
  const refreshList = () => {
    queryClient.invalidateQueries(NOTIFICATION_LIST.KEY)
  }

  const [modalConfiguration, setModalConfiguration] = useState({
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
      icon: 'FaTrash',
      text: formatMessage(messages.deleteTitle),
      action: () =>
        setModalConfiguration({
          notificationId: id,
          notificationName: name,
          showDialog: true,
        }),
      disabled: totalTriggers > 0,
    },
  ]
  return (
    <Fragment>
      <DeleteConfirmationModal
        {...modalConfiguration}
        onClose={() => {
          setModalConfiguration({})
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
    totalTriggers: PropTypes.number,
  }).isRequired,
}

export default NotificationsContextualMenu
