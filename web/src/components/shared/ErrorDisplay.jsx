// Imports from packages
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// Material-UI
import Snackbar from 'material-ui/Snackbar'

// Our own imports
import { removeError } from '../../error/ErrorRedux'

export class ErrorDisplay extends PureComponent {

  static propTypes = {
    error: PropTypes.object,
    removeError: PropTypes.func.isRequired
  }

  handleActionTouchTap = (error) => {
    alert(error.get('desc') ? JSON.stringify(error.get('desc'), null, '\t') : 'No error details')
  }

  render() {

    let error = this.props.error

    if (error.get('hasError')){
      return (
        <Snackbar
            open={true}
            message={error.get('title')}
            action="View Details"
            autoHideDuration={4000}
            onActionTouchTap={() => this.handleActionTouchTap(error)}
            onRequestClose={() => this.props.removeError()}
          />
        )
    } else {
      return null
    }
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
