import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import Helmet from 'react-helmet'
import { injectIntl } from 'react-intl'
import classNames from 'classnames'
import _ from 'lodash'
import { connect } from 'react-redux'
import LinearProgress from 'material-ui/LinearProgress'
import Paper from 'material-ui/Paper'
import { Tabs, Tab } from 'material-ui/Tabs'
import MapsPersonPin from 'material-ui/svg-icons/maps/person-pin'
import Language from 'material-ui/svg-icons/action/language'
import Lock from 'material-ui/svg-icons/action/lock'
import ContactDetailsForm from '../../person/detail/ContactDetailsForm'
import LoginDetailsForm from '../../person/detail/LoginDetailsForm'
import UserPreferencesForm from '../../person/detail/UserPreferencesForm'
import {
  fetchAccountDetails,
  saveContactDetails,
  saveLoginDetails,
  saveUserPreferences
} from '../AccountRedux'
import { addAcknowledgement } from '../../acknowledgement/AcknowledgementRedux'
import styles from './AccountDetails.css'
import accountDetailsMessages from './messages'
import personDetailsMessages from '../../person/detail/messages'

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
        saveUserPreferences, saveLoginDetails, addAcknowledgement } = this.props
    const saveLoginDetailsFailed = (errors) => {
      if (!errors.currentPassword) {
        this.closeCurrentPasswordInputDialog()
      }
    }
    const saveLoginDetailsSucceeded = () => {
      this.closeCurrentPasswordInputDialog()
      addAcknowledgement(formatMessage(personDetailsMessages.loginDetailsUpdated))
    }
    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(accountDetailsMessages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <Paper>
          <Tabs>
            <Tab
              icon={<MapsPersonPin />}
              label={<span className="pure-hidden-xs">{formatMessage(personDetailsMessages.contactDetails)}</span>}
            >
              {(loading || saving) && <LinearProgress />}
              <h2 className={classNames('pure-visible-xs', styles.Form__Header)}>
                {formatMessage(personDetailsMessages.contactDetails)}
              </h2>
              <ContactDetailsForm
                loading={loading || saving}
                initialValues={accountDetails.get('contactDetails')}
                onSubmit={saveContactDetails}
              />
            </Tab>
            <Tab
              icon={<Lock />}
              label={<span className="pure-hidden-xs">{formatMessage(accountDetailsMessages.usernameAndPassword)}</span>}
            >
              {(loading || saving) && <LinearProgress />}
              <h2 className={classNames('pure-visible-xs', styles.Form__Header)}>
                {formatMessage(accountDetailsMessages.usernameAndPassword)}
              </h2>
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
              label={<span className="pure-hidden-xs">{formatMessage(personDetailsMessages.languageAndTimezone)}</span>}
            >
              {(loading || saving) && <LinearProgress />}
              <h2 className={classNames('pure-visible-xs', styles.Form__Header)}>
                {formatMessage(personDetailsMessages.languageAndTimezone)}
              </h2>
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
    addAcknowledgement
  }, dispatch)
}

export const AccountDetailsContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(AccountDetails)
