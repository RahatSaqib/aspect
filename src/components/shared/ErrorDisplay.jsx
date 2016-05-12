import React from 'react'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import Snackbar from 'material-ui/Snackbar'
import { connect } from 'react-redux'
import { removeError } from '../../action_creators/error_creators'

export class ErrorDisplay extends React.Component {

  constructor(props) {
    super(props)
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
  }

  handleActionTouchTap = (error) => {
    alert(JSON.stringify(error.desc, null, '\t'))
  }

  render() {

    let error = this.props.error ? this.props.error.toObject() : null

    if (Object.keys(error).length !== 0){
      return (
        <Snackbar
            open={true}
            message={error.title}
            action="View Details"
            autoHideDuration={4000}
            onActionTouchTap={() => this.handleActionTouchTap(error)}
            onRequestClose={() => this.props.handleClose()}
          />
        )
    } else {
      return null
    }
  }
}

ErrorDisplay.propTypes = {
  error: React.PropTypes.object,
  handleClose: React.PropTypes.func.isRequired
}

function mapStateToProps(state) {
  return {
    error: state.get('error')
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    handleClose: () => {
      dispatch(removeError())
    }
  }
}

export const ErrorDisplayContainer = connect(mapStateToProps, mapDispatchToProps)(ErrorDisplay)
