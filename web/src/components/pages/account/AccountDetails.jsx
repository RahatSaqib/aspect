import React from 'react'
import { bindActionCreators } from 'redux'
import { injectIntl, defineMessages } from 'react-intl'
import _ from 'lodash'
import { connect } from 'react-redux'
import LinearProgress from 'material-ui/LinearProgress'
import Paper from 'material-ui/Paper'
import {Tabs, Tab} from 'material-ui/Tabs'
import ContactDetailsForm from './ContactDetailsForm'
import {fetchAccountDetails, saveAccountDetails} from '../../../action_creators/accountDetails_creators'
import styles from './AccountDetails.css'

const messages = defineMessages({
  loading: {
    id: 'pages.AccountDetails.loading',
    defaultMessage: 'Loading……'
  },
  contactDetails: {
    id: 'pages.AccountDetails.contactDetails',
    defaultMessage: 'Contact Details'
  },
  fullName: {
    id: 'pages.AccountDetails.name',
    defaultMessage: 'Full Name'
  },
  jobTitle: {
    id: 'pages.AccountDetails.title',
    defaultMessage: 'Job Title'
  },
  emailHeader: {
    id: 'pages.AccountDetails.emailHeader',
    defaultMessage: 'Email'
  },
  primaryEmail: {
    id: 'pages.AccountDetails.email',
    defaultMessage: 'Primary'
  },
  secondaryEmail: {
    id: 'pages.AccountDetails.email2',
    defaultMessage: 'Alternate'
  },
  phone: {
    id: 'pages.AccountDetails.phoneHeader',
    defaultMessage: 'Phone'
  },
  telephone: {
    id: 'pages.AccountDetails.phone',
    defaultMessage: 'Telephone'
  },
  mobile: {
    id: 'pages.AccountDetails.cell',
    defaultMessage: 'Mobile'
  },
  location: {
    id: 'pages.AccountDetails.locationHeader',
    defaultMessage: 'Location'
  },
  zip: {
    id: 'pages.AccountDetails.zip',
    defaultMessage: 'Zip Code'
  },
  save: {
    id: 'pages.AccountDetails.save',
    defaultMessage: 'Save'
  },
  loginDetails: {
    id: 'pages.AccountDetails.loginDetails',
    defaultMessage: 'Login Details'
  },
  userPreferences: {
    id: 'pages.AccountDetails.userPreferences',
    defaultMessage: 'User Preferences'
  }
})

class AccountDetails extends React.PureComponent {
  componentDidMount() {
    this.props.fetchAccountDetails()
  }

  render() {
    const { formatMessage } = this.props.intl
    const { loading, saving, accountDetails, saveAccountDetails } = this.props
    const labels = {
      name: formatMessage(messages.fullName),
      title: formatMessage(messages.jobTitle),
      emailHeader: formatMessage(messages.emailHeader),
      email: formatMessage(messages.primaryEmail),
      email2: formatMessage(messages.secondaryEmail),
      phoneHeader: formatMessage(messages.phone),
      phone: formatMessage(messages.telephone),
      cell: formatMessage(messages.mobile),
      locationHeader: formatMessage(messages.location),
      zip: formatMessage(messages.zip),
      submit: formatMessage(messages.save)
    }
    return (
      <div className={styles.Content}>
        {loading && <span>{formatMessage(messages.loading)}</span>}
        {(loading || saving) && <LinearProgress />}
        {!loading &&
        <Paper>
          <Tabs>
            <Tab label={formatMessage(messages.contactDetails)}>
              <ContactDetailsForm initialValues={accountDetails} onSubmit={saveAccountDetails} labels={labels} />
            </Tab>
            <Tab label={formatMessage(messages.loginDetails)}>
              <span>Change Username and Password Here!</span>
            </Tab>
            <Tab label={formatMessage(messages.userPreferences)}>
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

export const AccountDetailsContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(AccountDetails)
