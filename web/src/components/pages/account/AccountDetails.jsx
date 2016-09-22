import _ from 'lodash'
import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import AccountDetailsForm from './AccountDetailsForm'
import {fetchAccountDetails} from '../../../action_creators/accountDetails_creators'
import styles from './AccountDetails.css'

class AccountDetails extends React.PureComponent {
  componentDidMount() {
    this.props.fetchAccountDetails()
  }

  saveAccountDetails = this.saveAccountDetails.bind(this)
  saveAccountDetails(e) {
    e.preventDefault()
    this.props.fetchAccountDetails()
  }

  render() {
    const { accountDetails, loading } = this.props
    return (
      <div className={styles.Content}>
        {loading && <span>loading...</span>}
        {!loading && <AccountDetailsForm accountDetails={accountDetails} handleSubmit={this.saveAccountDetails} />}
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    loading: state.accountDetails.get('loading'),
    accountDetails: state.accountDetails.get('data')
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
