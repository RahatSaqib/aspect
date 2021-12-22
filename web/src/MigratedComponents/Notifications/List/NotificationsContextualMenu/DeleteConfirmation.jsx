import React, { useState, useEffect } from 'react'
import Button from '@material-ui/core/Button'
import { useNavigate } from 'react-router-dom'
import { useIntl } from 'react-intl'

import { useMutation } from 'react-query'
import AspectDialog from '../../../../components/shared/AspectDialog'
import messages from './messages'

import fetchWrapperForQueries from '../../../QueryFetch/index'
import { NOTIFICATION_DELETE } from '../../../QueryFetch/Notification/index'

const DeleteConfirmation = ({ notificationId, showDialog }) => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { formatMessage } = useIntl()
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
        navigate(`/browse/notification`)
      },
    }
  )
  useEffect(() => {
    setIsOpen(showDialog)
  }, [showDialog])
  const onCancelConfirmation = () => {
    setIsOpen(false)
  }
  return (
    <AspectDialog
      actions={[
        <Button color="primary" onClick={onCancelConfirmation}>
          {formatMessage(messages.cancel)}
        </Button>,
        <Button
          color="primary"
          variant="contained"
          onClick={() => deleteNotificationSubmit({ id: notificationId })}
        >
          {formatMessage(messages.yesDelete)}
        </Button>,
      ]}
      maxWidth="sm"
      onClose={onCancelConfirmation}
      open={isOpen}
    >
      <h3>Do you want to remove below assignment?</h3>
    </AspectDialog>
  )
}
export default DeleteConfirmation
