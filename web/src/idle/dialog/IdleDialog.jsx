import PropTypes from 'prop-types'
// Imports from packages
import React from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { connect } from 'react-redux'
import Dialog from 'material-ui/Dialog'
import { injectIntl, defineMessages, intlShape } from 'react-intl'

const messages = defineMessages({
  title: {
    id: 'pages.IdleDialog.title',
    defaultMessage: 'Automatic Logout',
  },
  help: {
    id: 'shared.IdleDialog.help',
    defaultMessage: 'You will be logged out automatically in one minute due to inactivity. To stay logged in, hit any button or move your mouse.',
  },
})

function mapStateToProps(state) {
  return {
    idleStatus: state.idle.idleStatus,
  }
}

const enhance = compose(
  pure,
  injectIntl,
  connect(mapStateToProps),
  setPropTypes({
    intl: intlShape.isRequired,
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
      <span>
        {formatMessage(messages.help)}
      </span>
    </Dialog>
  )
}

export const IdleDialogContainer = enhance(IdleDialog)

export default IdleDialogContainer
