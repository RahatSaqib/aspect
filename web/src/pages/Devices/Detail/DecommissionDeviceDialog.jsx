import React from 'react'
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { toast } from 'react-toastify'
import AspectButton from '../../../components/shared/AspectButton'
import useDecommissionDevice from '../../../hooks/device/useDecommissionDevice'
import messages from './messages'
import profileMessages from './Profile/messages'

const DecommissionDeviceDialog = ({ open, onClose, deviceId }) => {
  const { formatMessage } = useIntl()
  const decommissionMutation = useDecommissionDevice()

  const handleConfirm = () => {
    decommissionMutation.mutate(
      { deviceId },
      {
        onSuccess: () => onClose(),
        onError: () => toast.error(formatMessage(messages.decommission)),
      }
    )
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{formatMessage(messages.decommissionConfirmTitle)}</DialogTitle>
      <DialogContent>
        <DialogContentText>{formatMessage(messages.decommissionConfirmMessage)}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <AspectButton onClick={onClose}>{formatMessage(profileMessages.cancel)}</AspectButton>
        <AspectButton
          color="primary"
          variant="contained"
          onClick={handleConfirm}
          disabled={decommissionMutation.isLoading}
        >
          {formatMessage(profileMessages.confirm)}
        </AspectButton>
      </DialogActions>
    </Dialog>
  )
}

DecommissionDeviceDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  deviceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
}

export default DecommissionDeviceDialog
