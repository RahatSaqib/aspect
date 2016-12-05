// Imports from packages
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import _ from 'lodash'

// Material-UI
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'

// Our own imports
import { removeError } from '../../error/ErrorRedux'

export class ErrorDisplay extends PureComponent {

  static propTypes = {
    error: PropTypes.object,
    removeError: PropTypes.func.isRequired
  }

  handleClose = () => {
    this.props.removeError()
  }

  render() {
    const { error } = this.props

    const actions = [
      <FlatButton
        label="Close"
        primary
        onTouchTap={this.handleClose}
      />
    ]

    const errorMessage = error.get('message')
    return (
      <Dialog
        title={error.get('title')}
        actions={actions}
        modal={false}
        open={error.get('hasError')}
        onRequestClose={this.handleClose}
      >
        {_.isString(errorMessage) ? <span dangerouslySetInnerHTML={{ __html: errorMessage }} /> : JSON.stringify(errorMessage, null, '\t')}
      </Dialog>
    )
  }
}

function mapStateToProps(state) {
  return {
    error: state.get('error')
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ removeError }, dispatch)
}

export const ErrorDisplayContainer = connect(mapStateToProps, mapDispatchToProps)(ErrorDisplay)
