import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { injectIntl, defineMessages } from 'react-intl'
import _ from 'lodash'
import { connect } from 'react-redux'
import LinearProgress from 'material-ui/LinearProgress'
import Paper from 'material-ui/Paper'
import {Tabs, Tab} from 'material-ui/Tabs'
import MapsPersonPin from 'material-ui/svg-icons/maps/person-pin'
import Language from 'material-ui/svg-icons/action/language'
import Lock from 'material-ui/svg-icons/action/lock'
import ContactDetailsForm from './ContactDetailsForm'
import LoginDetailsForm from './LoginDetailsForm'
import {
  fetchAccountDetails,
  saveContactDetails,
  saveLoginDetails,
  saveUserPreferences
} from '../AccountRedux'
import styles from './AccountDetails.css'

const messages = defineMessages({
  title: {
    id: 'pages.AccountDetails.title',
    defaultMessage: 'Account Details'
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
  usernameAndPassword: {
    id: 'pages.AccountDetails.usernameAndPassword',
    defaultMessage: 'Username & Password'
  },
  username: {
    id: 'pages.AccountDetails.username',
    defaultMessage: 'Username'
  },
  passwordHeader: {
    id: 'pages.AccountDetails.passwordHeader',
    defaultMessage: 'Password'
  },
  currentPassword: {
    id: 'pages.AccountDetails.currentPassword',
    defaultMessage: 'Current Password'
  },
  newPassword: {
    id: 'pages.AccountDetails.newPassword',
    defaultMessage: 'New Password'
  },
  confirmNewPassword: {
    id: 'pages.AccountDetails.confirmNewPassword',
    defaultMessage: 'Confirm'
  },
  languageAndTimezone: {
    id: 'pages.AccountDetails.languageAndTimezone',
    defaultMessage: 'Language & Timezone'
  }
})

class AccountDetails extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired
  }

  componentWillMount() {
    const { setPageTitle, intl } = this.props
    const { formatMessage } = intl
    setPageTitle(formatMessage(messages.title))
  }

  componentDidMount() {
    const {fetchAccountDetails} = this.props
    fetchAccountDetails()
  }

  render() {
    const { intl, loading, saving, accountDetails, saveContactDetails, saveLoginDetails } = this.props
    const { formatMessage } = intl
    const contactDetailsLabels = {
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
    const loginDetailsLabels = {
      username: formatMessage(messages.username),
      passwordHeader: formatMessage(messages.passwordHeader),
      currentPassword: formatMessage(messages.currentPassword),
      newPassword: formatMessage(messages.newPassword),
      confirmNewPassword: formatMessage(messages.confirmNewPassword),
      submit: formatMessage(messages.save)
    }
    return (
      <div className={styles.Content}>
        <Paper>
          <Tabs>
            <Tab className={styles.ResponsiveTab} icon={<MapsPersonPin />}
                 label={<span className="pure-hidden-xs">{formatMessage(messages.contactDetails)}</span>}>
              {(loading || saving) && <LinearProgress />}
              <h2 className={'pure-visible-xs ' + styles.Form__Header}>{formatMessage(messages.contactDetails)}</h2>
              {!loading && <ContactDetailsForm loading={loading || saving} initialValues={accountDetails} onSubmit={saveContactDetails} labels={contactDetailsLabels} />}
            </Tab>
            <Tab className={styles.ResponsiveTab} icon={<Lock />}
                 label={<span className="pure-hidden-xs">{formatMessage(messages.usernameAndPassword)}</span>}>
              {(loading || saving) && <LinearProgress />}
              <h2 className={'pure-visible-xs ' + styles.Form__Header}>{formatMessage(messages.usernameAndPassword)}</h2>
              {!loading && <LoginDetailsForm loading={loading || saving} onSubmit={saveLoginDetails} labels={loginDetailsLabels} />}
            </Tab>
            <Tab className={styles.ResponsiveTab} icon={<Language />}
                 label={<span className="pure-hidden-xs">{formatMessage(messages.languageAndTimezone)}</span>}>
              {(loading || saving) && <LinearProgress />}
              <h2 className={'pure-visible-xs ' + styles.Form__Header}>{formatMessage(messages.languageAndTimezone)}</h2>
              <span>Timezone and Language Here!</span>
            </Tab>
          </Tabs>
        </Paper>
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
    saveContactDetails,
    saveLoginDetails,
    saveUserPreferences
  }, dispatch)
}

export const AccountDetailsContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(AccountDetails)
