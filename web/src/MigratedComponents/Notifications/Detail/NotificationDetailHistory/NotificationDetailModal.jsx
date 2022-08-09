import React, { useState } from 'react'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Grid from '@mui/material/Grid'
import ListItemText from '@mui/material/ListItemText'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import PropTypes from 'prop-types'
import AspectDialog from '../../../../components/shared/AspectDialog'
import messages from './messages'
import useI18n from '../../../../Hooks/i18n/useI18n'

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
      title={formatMessage(messages.sentDetails)}
      onClose={onCancelConfirmation}
      open={showDialog || false}
    >
      <Grid>
        <Grid item style={{ padding: 10 }}>
          <Grid
            container
            spacing={16}
            sx={{
              width: 'auto',
              margin: 0,
            }}
          >
            <Grid
              item
              xs={12}
              sm={6}
              lg={3}
              container
              direction="row"
              justifyContent="space-evenly"
              alignItems="center"
            >
              <Avatar
                style={{
                  color: '#fff',
                  backgroundColor: colors.Sent,
                }}
              >
                {sent}
              </Avatar>
              <span>{formatMessage(messages.sentSuccessfully)}</span>
            </Grid>
            <Grid
              item
              xs={12}
              sm={6}
              lg={3}
              container
              direction="row"
              justifyContent="space-evenly"
              alignItems="center"
            >
              <Avatar
                style={{
                  color: '#fff',
                  backgroundColor: colors.Error,
                }}
              >
                {withErrors}
              </Avatar>
              <span>{formatMessage(messages.sentWithErrors)}</span>
            </Grid>
            <Grid
              item
              xs={12}
              sm={6}
              lg={3}
              container
              direction="row"
              justifyContent="space-evenly"
              alignItems="center"
            >
              <Avatar
                style={{
                  color: '#fff',
                  backgroundColor: colors.Pending,
                }}
              >
                {pending}
              </Avatar>
              <span>
                <span>{formatMessage(messages.sentPending)}</span>
              </span>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} md={6} style={{ margin: 10 }}>
          <Typography variant="h7">{formatMessage(messages.contactDetails)}</Typography>
          <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
            {notificationData &&
              notificationData.length &&
              notificationData.map((recipient, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <ListItem key={`${recipient.split('-')[0]}${index}`}>
                  <ListItemAvatar>
                    <Avatar
                      style={{
                        color: '#fff',
                        backgroundColor: colors[recipient.split('-')[1]],
                      }}
                    />
                  </ListItemAvatar>
                  <ListItemText primary={recipient.split('-')[0]} />
                </ListItem>
              ))}
          </List>
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
