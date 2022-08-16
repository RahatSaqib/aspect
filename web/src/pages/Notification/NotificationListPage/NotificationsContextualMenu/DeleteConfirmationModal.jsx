import React, { useState, useEffect } from 'react'
import Button from '@mui/material/Button'
import PropTypes from 'prop-types'
import { useMutation } from 'react-query'
import AspectDialog from '../../../../oldComponents/shared/AspectDialog'
import messages from './messages'

import fetchWrapperForQueries from '../../../../components/QueryFetch/index'
import { NOTIFICATION_DELETE } from '../../../../components/QueryFetch/Notification/index'
import useI18n from '../../../../hooks/useI18n'

const DeleteConfirmationModal = ({ notificationId, notificationName = '', showDialog, onClose }) => {
  const [notificationData, setNotificationData] = useState({})
  const { formatMessage } = useI18n()
  const { mutate: deleteNotificationSubmit } = useMutation(
    ({ id }) => {
      const endpoint = `${NOTIFICATION_DELETE.ENDPOINT}${id}`
      return fetchWrapperForQueries({
        endpoint,
        method: 'DELETE',
      })
    },
    {
      onSuccess: () => {
        onClose()
      },
    }
  )
  useEffect(() => {
    setNotificationData({ notificationId, notificationName })
  }, [notificationId, notificationName])
  const onCancelConfirmation = () => {}
  return (
    <AspectDialog
      actions={[
        <Button color="primary" onClick={onClose}>
          {formatMessage(messages.cancel)}
        </Button>,
        <Button
          color="primary"
          variant="contained"
          onClick={() => deleteNotificationSubmit({ id: notificationData.notificationId })}
        >
          {formatMessage(messages.yesDelete)}
        </Button>,
      ]}
      title="Delete confirmation"
      onClose={onCancelConfirmation}
      open={showDialog || false}
    >
      <h3>
        {formatMessage(messages.areYouSureToDelete, {
          notificationName: notificationData.notificationName,
        })}
      </h3>
    </AspectDialog>
  )
}

DeleteConfirmationModal.propTypes = {
  notificationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  notificationName: PropTypes.string,
  showDialog: PropTypes.bool,
  onClose: PropTypes.func,
}

DeleteConfirmationModal.defaultProps = {
  notificationId: 0,
  notificationName: '',
  showDialog: false,
  onClose: () => false,
}
export default DeleteConfirmationModal
