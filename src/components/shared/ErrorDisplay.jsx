import React from 'react'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import Snackbar from 'material-ui/Snackbar'
import {connect} from 'react-redux'
import * as actionCreators from '../../action_creators/action_creators'

class ErrorDisplay extends React.Component {

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

function mapStateToProps(state) {
  return {
    error: state.get('error')
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    handleClose: () => {
      dispatch(actionCreators.removeError())
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ErrorDisplay)
