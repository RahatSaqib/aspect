import React from 'react'
import { bindActionCreators } from 'redux'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import { connect } from 'react-redux'

import Snackbar from 'material-ui/Snackbar'

import { removeError } from '../../action_creators/error_creators'

export class ErrorDisplay extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
  }

  handleActionTouchTap = (error) => {
    alert(error.get('desc') ? JSON.stringify(error.get('desc'), null, '\t') : 'No error details')
  }

  render() {

    let error = this.props.error

    if (!error.isEmpty()){
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

ErrorDisplay.propTypes = {
  error: React.PropTypes.object,
  removeError: React.PropTypes.func.isRequired
}

function mapStateToProps(state) {
  return {
    error: state.get('error')
  }
}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({ removeError }, dispatch)
}

export const ErrorDisplayContainer = connect(mapStateToProps, mapDispatchToProps)(ErrorDisplay)
