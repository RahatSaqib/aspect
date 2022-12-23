import React, { useState } from 'react'
import { Avatar, Button, Grid, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import useI18n from '../../../../hooks/useI18n'
import AspectDialog from '../../../../oldComponents/shared/AspectDialog'
import messages from './messages'

const NotificationDetailModal = ({ sent, withErrors, pending, showDialog, onClose, recipients = [] }) => {
  const [notificationData] = useState(recipients)
  const { formatMessage } = useI18n()

  const colors = {
    Sent: '#34717c',
    Error: '#db3018',
    Pending: '#f7b500',
    Initial: '#f7b500',
  }
  const onCancelConfirmation = () => {}
  return (
    <AspectDialog
      actions={[
        <Button variant="contained" color="primary" onClick={onClose}>
          {formatMessage(messages.cancel)}
        </Button>,
      ]}
      modal
      // title={formatMessage(messages.sentDetails)}
      onClose={onCancelConfirmation}
      open={showDialog || false}
    >
      <Grid>
        <Grid item>
          <Grid container sx={{ width: 'auto', margin: 0 }}>
            <Grid item xs={12} sm={4} container direction="row" justifyContent="space-evenly" alignItems="center">
              <Avatar style={{ color: '#fff', backgroundColor: colors.Sent }}>{sent}</Avatar>
              <span>{formatMessage(messages.sentSuccessfully)}</span>
            </Grid>
            <Grid item xs={12} sm={4} container direction="row" justifyContent="space-evenly" alignItems="center">
              <Avatar style={{ color: '#fff', backgroundColor: colors.Error }}>{withErrors}</Avatar>
              <span>{formatMessage(messages.sentWithErrors)}</span>
            </Grid>
            <Grid item xs={12} sm={4} container direction="row" justifyContent="space-evenly" alignItems="center">
              <Avatar style={{ color: '#fff', backgroundColor: colors.Pending }}>{pending}</Avatar>
              <span>
                <span>{formatMessage(messages.sentPending)}</span>
              </span>
            </Grid>
          </Grid>
        </Grid>
        <Grid item style={{ margin: 10 }}>
          <Typography variant="h6">{formatMessage(messages.contactDetails)}</Typography>
          <Grid container sx={{ width: 'auto', margin: 0 }}>
            {notificationData &&
              notificationData.length &&
              notificationData.map(recipient => (
                <Grid item xs={12} sm={4} container direction="row" justifyContent="space-evenly" alignItems="center">
                  <Avatar style={{ color: '#fff', backgroundColor: colors[recipient.split('-')[1]] }} />
                  <span>{recipient.split('-')[0]}</span>
                </Grid>
              ))}
          </Grid>
        </Grid>
      </Grid>
    </AspectDialog>
  )
}

NotificationDetailModal.propTypes = {
  sent: PropTypes.number,
  withErrors: PropTypes.number,
  pending: PropTypes.number,
  showDialog: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  recipients: PropTypes.arrayOf(PropTypes.string),
}

NotificationDetailModal.defaultProps = {
  recipients: [],
  showDialog: false,
  sent: 0,
  withErrors: 0,
  pending: 0,
}
export default NotificationDetailModal
