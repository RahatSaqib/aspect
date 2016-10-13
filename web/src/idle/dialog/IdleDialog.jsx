// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { connect } from 'react-redux'
import Dialog from 'material-ui/Dialog'
import {
  injectIntl,
  defineMessages
} from 'react-intl'

const messages = defineMessages({
  title: {
    id: 'pages.IdleDialog.title',
    defaultMessage: 'Automatic Logout'
  },
  help: {
    id: 'shared.IdleDialog.help',
    defaultMessage: '<p>You will be logged out automatically in one minute due to inactivity.</p><p>To stay logged in, hit any button or move your mouse.</p>'
  }
})

export class IdleDialog extends PureComponent {

  static propTypes = {
    idleStatus: PropTypes.string.isRequired
  }

  render() {

    const { formatMessage } = this.props.intl

    return (
      <Dialog
        title={formatMessage(messages.title)}
        modal={true}
        open={this.props.idleStatus === 'IDLESTATUS_INACTIVE'}>
          <span dangerouslySetInnerHTML={{__html: formatMessage(messages.help)}} ></span>
      </Dialog>
    )
  }
}

function mapStateToProps(state) {
  return {
    idleStatus: state.idle.idleStatus
  }
}

export const IdleDialogContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps)
)(IdleDialog)
