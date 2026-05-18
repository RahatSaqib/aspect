import React, { useState, useEffect } from 'react'
import { Button } from '@mui/material'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { useMutation } from 'react-query'
import fetchWrapperForQueries from '../../../../components/QueryFetch/index'
import { NOTIFICATION_DETAIL } from '../../../../components/QueryFetch/Notification/index'
import AspectDialog from '../../../../components/shared/AspectDialog'
import messages from './messages'

const ToggleStatusConfirmationModal = ({
  notificationId,
  notificationName = '',
  notificationEnabled,
  showDialog,
  onClose,
}) => {
  const [notificationData, setNotificationData] = useState({})
  const { formatMessage } = useIntl()
  const { mutate: toggleStatusNotificationSubmit } = useMutation(
    ({ id }) => {
      const endpoint = `${NOTIFICATION_DETAIL.ENDPOINT}/${id}/change-status`

      return fetchWrapperForQueries({
        endpoint,
        method: 'PUT',
        params: { enabled: !notificationEnabled },
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
          onClick={() => toggleStatusNotificationSubmit({ id: notificationData.notificationId })}
        >
          {formatMessage(messages.yes)}
        </Button>,
      ]}
      title={formatMessage(messages.toggleStatusModalTitle)}
      onClose={onCancelConfirmation}
      open={showDialog || false}
    >
      <h3>
        {formatMessage(messages.areYouSureToToggleStatus, {
          notificationName: notificationData.notificationName,
        })}
      </h3>
    </AspectDialog>
  )
}

ToggleStatusConfirmationModal.propTypes = {
  notificationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  notificationName: PropTypes.string,
  notificationEnabled: PropTypes.bool,
  showDialog: PropTypes.bool,
  onClose: PropTypes.func,
}

ToggleStatusConfirmationModal.defaultProps = {
  notificationId: 0,
  notificationName: '',
  notificationEnabled: false,
  showDialog: false,
  onClose: () => false,
}
export default ToggleStatusConfirmationModal
