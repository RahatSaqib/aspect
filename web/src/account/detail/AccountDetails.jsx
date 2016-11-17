import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { injectIntl, defineMessages } from 'react-intl'
import _ from 'lodash'
import { connect } from 'react-redux'
import LinearProgress from 'material-ui/LinearProgress'
import Paper from 'material-ui/Paper'
import { Tabs, Tab } from 'material-ui/Tabs'
import MapsPersonPin from 'material-ui/svg-icons/maps/person-pin'
import Language from 'material-ui/svg-icons/action/language'
import Lock from 'material-ui/svg-icons/action/lock'
import ContactDetailsForm from './ContactDetailsForm'
import LoginDetailsForm from './LoginDetailsForm'
import UserPreferencesForm from './UserPreferencesForm'
import {
  fetchAccountDetails,
  saveContactDetails,
  saveLoginDetails,
  saveUserPreferences
} from '../AccountRedux'
import { addAcknowledgement } from '../../acknowledgement/AcknowledgementRedux'
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
  usernameAndPassword: {
    id: 'pages.AccountDetails.usernameAndPassword',
    defaultMessage: 'Username & Password'
  },
  loginDetailsUpdated: {
    id: 'pages.AccountDetails.loginDetailsUpdated',
    defaultMessage: 'Login details changed successfully'
  },
  languageAndTimezone: {
    id: 'pages.AccountDetails.languageAndTimezone',
    defaultMessage: 'Language & Timezone'
  }
})

export class AccountDetails extends PureComponent {
  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    fetchAccountDetails: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
    saving: PropTypes.bool.isRequired,
    accountDetails: PropTypes.object.isRequired,
    saveContactDetails: PropTypes.func.isRequired,
    saveLoginDetails: PropTypes.func.isRequired,
    saveUserPreferences: PropTypes.func.isRequired,
    addAcknowledgement: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)

    this.state = {
      currentPasswordInputDialogOpen: false
    }

    this.openCurrentPasswordInputDialog = this.openCurrentPasswordInputDialog.bind(this)
    this.closeCurrentPasswordInputDialog = this.closeCurrentPasswordInputDialog.bind(this)
  }

  componentWillMount() {
    const { setPageTitle, intl } = this.props
    const { formatMessage } = intl
    setPageTitle(formatMessage(messages.title))
  }

  componentDidMount() {
    const { fetchAccountDetails } = this.props
    fetchAccountDetails()
  }

  componentWillReceiveProps(newProps) {
    if (newProps.accountDetails && newProps.accountDetails.getIn(['loginDetails', 'incorrectCurrentPasswordEntered'])) {
      this.openCurrentPasswordInputDialog()
    }
  }

  openCurrentPasswordInputDialog = () => {
    this.setState({ currentPasswordInputDialogOpen: true })
  }

  closeCurrentPasswordInputDialog = () => {
    this.setState({ currentPasswordInputDialogOpen: false })
  }

  render() {
    const { loading, saving, accountDetails, saveContactDetails,
        saveUserPreferences, saveLoginDetails, addAcknowledgement } = this.props
    const { formatMessage } = this.props.intl
    const saveLoginDetailsFailed = (errors) => {
      if (!errors.currentPassword) {
        this.closeCurrentPasswordInputDialog()
      }
    }
    const saveLoginDetailsSucceeded = () => {
      this.closeCurrentPasswordInputDialog()
      addAcknowledgement(formatMessage(messages.loginDetailsUpdated))
    }
    return (
      <div className={styles.Content}>
        <Paper>
          <Tabs>
            <Tab
              className={styles.ResponsiveTab} icon={<MapsPersonPin />}
              label={<span className="pure-hidden-xs">{formatMessage(messages.contactDetails)}</span>}
            >
              {(loading || saving) && <LinearProgress />}
              <h2 className={`pure-visible-xs ${styles.Form__Header}`}>
                {formatMessage(messages.contactDetails)}
              </h2>
              {!loading && <ContactDetailsForm
                loading={loading || saving}
                initialValues={accountDetails.get('contactDetails')}
                onSubmit={saveContactDetails}
              />}
            </Tab>
            <Tab
              className={styles.ResponsiveTab} icon={<Lock />}
              label={<span className="pure-hidden-xs">{formatMessage(messages.usernameAndPassword)}</span>}
            >
              {(loading || saving) && <LinearProgress />}
              <h2 className={`pure-visible-xs ${styles.Form__Header}`}>
                {formatMessage(messages.usernameAndPassword)}
              </h2>
              {!loading && <LoginDetailsForm
                loading={loading || saving}
                initialValues={accountDetails.get('loginDetails')}
                currentPasswordInputDialogOpen={this.state.currentPasswordInputDialogOpen}
                openCurrentPasswordInputDialog={this.openCurrentPasswordInputDialog}
                closeCurrentPasswordInputDialog={this.closeCurrentPasswordInputDialog}
                onSubmit={saveLoginDetails} onSubmitFail={saveLoginDetailsFailed}
                onSubmitSuccess={saveLoginDetailsSucceeded}
              />}
            </Tab>
            <Tab
              className={styles.ResponsiveTab} icon={<Language />}
              label={<span className="pure-hidden-xs">{formatMessage(messages.languageAndTimezone)}</span>}
            >
              {(loading || saving) && <LinearProgress />}
              <h2 className={`pure-visible-xs ${styles.Form__Header}`}>
                {formatMessage(messages.languageAndTimezone)}
              </h2>
              {!loading && <UserPreferencesForm
                loading={loading || saving}
                initialValues={accountDetails.get('userPreferences')}
                onSubmit={saveUserPreferences}
              />}
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
    saveUserPreferences,
    addAcknowledgement
  }, dispatch)
}

export const AccountDetailsContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(AccountDetails)
