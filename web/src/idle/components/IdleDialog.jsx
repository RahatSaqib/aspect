import PropTypes from 'prop-types'
// Imports from packages
import React from 'react'
import { compose, setPropTypes } from 'recompose'
import { connect } from 'react-redux'
import { defineMessages } from 'react-intl'
import Dialog from '../../components/shared/Dialog'

const messages = defineMessages({
  title: {
    id: 'pages.IdleDialog.title',
    defaultMessage: 'Automatic Logout',
  },
  help: {
    id: 'shared.IdleDialog.help',
    defaultMessage:
      'You will be logged out automatically in one minute due to inactivity. To stay logged in, hit any button or move your mouse.',
  },
})

function mapStateToProps(state) {
  return {
    idleStatus: state.idle.idleStatus,
  }
}

const enhance = compose(
  connect(mapStateToProps),
  setPropTypes({
    idleStatus: PropTypes.string.isRequired,
  })
)

export const IdleDialog = ({ intl, idleStatus }) => {
  const { formatMessage } = intl

  return (
    <Dialog
      title={formatMessage(messages.title)}
      modal
      open={idleStatus === 'IDLESTATUS_INACTIVE'}
    >
      <span>{formatMessage(messages.help)}</span>
    </Dialog>
  )
}

export default enhance(IdleDialog)
