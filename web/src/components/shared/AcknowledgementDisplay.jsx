// Imports from packages
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

// Material-UI
import Snackbar from 'material-ui/Snackbar'

// Our own imports
import { removeAcknowledgement } from '../../acknowledgement/AcknowledgementRedux'

class AcknowledgementDisplay extends PureComponent {

  static propTypes = {
    acknowledgement: PropTypes.object,
    removeAcknowledgement: PropTypes.func.isRequired
  }

  render() {

    let acknowledgement = this.props.acknowledgement

    if (acknowledgement.get('hasAcknowledgement')){
      return (
        <Snackbar
          open
          message={acknowledgement.get('message')}
          autoHideDuration={4000}
          onRequestClose={() => this.props.removeAcknowledgement()}
        />
      )
    } else {
      return null
    }
  }
}

function mapStateToProps(state) {
  return {
    acknowledgement: state.get('acknowledgement')
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ removeAcknowledgement }, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(AcknowledgementDisplay)
