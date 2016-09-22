import _ from 'lodash'
import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import {fetchAccountDetails} from '../../../action_creators/accountDetails_creators'

class AccountDetails extends React.PureComponent {
  componentDidMount() {
    this.props.fetchAccountDetails()
  }

  render() {
    const { loading, accountDetails } = this.props
    return (
      <div className="content">
        Loading: {String(loading)}
        <br/>
        Username: {accountDetails.username}
        <br/>
        Full Name: {accountDetails.name}
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    loading: state.accountDetails.loading,
    accountDetails: state.accountDetails.data
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchAccountDetails
  }, dispatch)
}

export const AccountDetailsContainer = _.flowRight(
  connect(mapStateToProps, mapDispatchToProps)
)(AccountDetails)
