import _ from 'lodash'
import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import LinearProgress from 'material-ui/LinearProgress'
import AccountDetailsForm from './AccountDetailsForm'
import {fetchAccountDetails, saveAccountDetails} from '../../../action_creators/accountDetails_creators'
import styles from './AccountDetails.css'

class AccountDetails extends React.PureComponent {
  componentDidMount() {
    this.props.fetchAccountDetails()
  }

  render() {
    const { loading, saving, accountDetails, saveAccountDetails } = this.props
    return (
      <div className={styles.Content}>
        {loading && <span>Loading...</span>}
        {(loading || saving) && <LinearProgress />}
        {!loading && <AccountDetailsForm initialValues={accountDetails} onSubmit={saveAccountDetails} />}
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    loading: state.accountDetails.get('loading'),
    saving: state.accountDetails.get('saving'),
    loadingMessage: state.accountDetails.get('loadingMessage'),
    accountDetails: state.accountDetails.get('data')
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchAccountDetails,
    saveAccountDetails
  }, dispatch)
}

export const AccountDetailsContainer = _.flowRight(
  connect(mapStateToProps, mapDispatchToProps)
)(AccountDetails)
