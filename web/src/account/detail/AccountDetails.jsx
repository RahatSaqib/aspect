import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import Helmet from 'react-helmet'
import { injectIntl, intlShape } from 'react-intl'
import _ from 'lodash'
import { connect } from 'react-redux'
import LinearProgress from 'material-ui/LinearProgress'
import Paper from 'material-ui/Paper'
import { Tabs, Tab } from 'material-ui/Tabs'
import MapsPersonPin from 'material-ui/svg-icons/maps/person-pin'
import Language from 'material-ui/svg-icons/action/language'
import Lock from 'material-ui/svg-icons/action/lock'

import { Hidden, Visible } from '../../components/pureGrids'
import ContactDetailsForm from '../../person/detail/ContactDetailsForm'
import LoginDetailsForm from '../../person/detail/LoginDetailsForm'
import UserPreferencesForm from '../../person/detail/UserPreferencesForm'
import {
  fetchAccountDetails,
  saveContactDetails,
  saveLoginDetails,
  saveUserPreferences
} from '../AccountRedux'
import { showAcknowledgement } from '../../appNotification/AppNotificationRedux'
import styles from './AccountDetails.css'
import accountDetailsMessages from './messages'
import personDetailsMessages from '../../person/detail/messages'
import { ContactDetails, LoginDetails, UserPreferences } from '../../person/PersonRedux'

export class AccountDetails extends PureComponent {
  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    intl: intlShape.isRequired,
    fetchAccountDetails: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
    saving: PropTypes.bool.isRequired,
    accountDetails: PropTypes.shape({
      contactDetails: PropTypes.objectOf(ContactDetails),
      loginDetails: PropTypes.objectOf(LoginDetails),
      userPreferences: PropTypes.objectOf(UserPreferences),
    }).isRequired,
    saveContactDetails: PropTypes.func.isRequired,
    saveLoginDetails: PropTypes.func.isRequired,
    saveUserPreferences: PropTypes.func.isRequired,
    showAcknowledgement: PropTypes.func.isRequired
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
    setPageTitle(formatMessage(accountDetailsMessages.title))
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
    const { intl: { formatMessage }, loading, saving, accountDetails, saveContactDetails,
        saveUserPreferences, saveLoginDetails, showAcknowledgement } = this.props
    const saveLoginDetailsFailed = (errors) => {
      if (!errors.currentPassword) {
        this.closeCurrentPasswordInputDialog()
      }
    }
    const saveLoginDetailsSucceeded = () => {
      this.closeCurrentPasswordInputDialog()
      showAcknowledgement({
        title: personDetailsMessages.detailsUpdatedSuccessfully,
        message: personDetailsMessages.loginDetailsUpdatedMessage
      })
    }
    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(accountDetailsMessages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <Paper>
          <Tabs>
            <Tab
              icon={<MapsPersonPin />}
              label={<Hidden xs component="span">{formatMessage(personDetailsMessages.contactDetails)}</Hidden>}
            >
              {(loading || saving) && <LinearProgress />}
              <Visible xs component="h2" className={styles.Form__Header}>
                {formatMessage(personDetailsMessages.contactDetails)}
              </Visible>
              <ContactDetailsForm
                loading={loading || saving}
                initialValues={accountDetails.get('contactDetails')}
                onSubmit={saveContactDetails}
              />
            </Tab>
            <Tab
              icon={<Lock />}
              label={<Hidden xs component="span">{formatMessage(accountDetailsMessages.usernameAndPassword)}</Hidden>}
            >
              {(loading || saving) && <LinearProgress />}
              <Visible xs component="h2" className={styles.Form__Header}>
                {formatMessage(accountDetailsMessages.usernameAndPassword)}
              </Visible>
              <LoginDetailsForm
                loading={loading || saving}
                initialValues={accountDetails.get('loginDetails')}
                currentPasswordInputDialogOpen={this.state.currentPasswordInputDialogOpen}
                openCurrentPasswordInputDialog={this.openCurrentPasswordInputDialog}
                closeCurrentPasswordInputDialog={this.closeCurrentPasswordInputDialog}
                onSubmit={saveLoginDetails} onSubmitFail={saveLoginDetailsFailed}
                onSubmitSuccess={saveLoginDetailsSucceeded}
              />
            </Tab>
            <Tab
              icon={<Language />}
              label={<Hidden xs component="span">{formatMessage(personDetailsMessages.languageAndTimezone)}</Hidden>}
            >
              {(loading || saving) && <LinearProgress />}
              <Visible xs component="h2" className={styles.Form__Header}>
                {formatMessage(personDetailsMessages.languageAndTimezone)}
              </Visible>
              <UserPreferencesForm
                loading={loading || saving}
                initialValues={accountDetails.get('userPreferences')}
                onSubmit={saveUserPreferences}
              />
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
    showAcknowledgement
  }, dispatch)
}

export const AccountDetailsContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(AccountDetails)
