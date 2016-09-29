import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import LinearProgress from 'material-ui/LinearProgress'
import Paper from 'material-ui/Paper'
import {Tabs, Tab} from 'material-ui/Tabs'
import ContactDetailsForm from './ContactDetailsForm'
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
        {!loading &&
        <Paper>
          <Tabs>
            <Tab label="Contact Details">
              <ContactDetailsForm initialValues={accountDetails} onSubmit={saveAccountDetails} />
            </Tab>
            <Tab label="Login Details">
              <span>Change Username and Password Here!</span>
            </Tab>
            <Tab label="User Preferences">
              <span>Timezone and Language Here!</span>
            </Tab>
          </Tabs>
        </Paper>}
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    loading: state.accountDetails.get('loading'),
    saving: state.accountDetails.get('saving'),
    accountDetails: state.accountDetails.get('data')
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchAccountDetails,
    saveAccountDetails
  }, dispatch)
}

export const AccountDetailsContainer = connect(mapStateToProps, mapDispatchToProps)(AccountDetails)
