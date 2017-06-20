import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { bindActionCreators } from 'redux'
import Helmet from 'react-helmet'
import { injectIntl, intlShape } from 'react-intl'
import { connect } from 'react-redux'
import LinearProgress from 'material-ui/LinearProgress'
import Paper from 'material-ui/Paper'
import { Tabs, Tab } from 'material-ui/Tabs'
import MapsPersonPin from 'material-ui/svg-icons/maps/person-pin'
import Language from 'material-ui/svg-icons/action/language'
import Lock from 'material-ui/svg-icons/action/lock'

import { Hidden, Visible } from '../../components/pureGrids'
import NavTitle from '../../globals/components/NavTitle'
import ContactDetailsForm from '../../person/detail/ContactDetailsForm'
import LoginDetailsForm from '../../person/detail/LoginDetailsForm'
import UserPreferencesForm from '../../person/detail/UserPreferencesForm'
import {
  fetchAccountDetails,
  saveContactDetails,
  saveLoginDetails,
  saveUserPreferences,
} from '../AccountRedux'
import { showAcknowledgement } from '../../appNotification/AppNotificationRedux'
import styles from './AccountDetails.css'
import accountDetailsMessages from './messages'
import personDetailsMessages from '../../person/detail/messages'
import {
  ContactDetails,
  LoginDetails,
  UserPreferences,
} from '../../person/PersonRedux'

const enhance = compose(
  setPropTypes({
    location: PropTypes.object.isRequired, // eslint-disable-line
    history: PropTypes.object.isRequired, // eslint-disable-line
  }),
  pure,
  injectIntl,
  connect(
    state => ({
      loading: state.accountDetails.get('loading'),
      saving: state.accountDetails.get('saving'),
      accountDetails: state.accountDetails.get('data'),
    }),
    dispatch =>
      bindActionCreators(
        {
          showAcknowledgement,
          fetchAccountDetails,
          saveContactDetails,
          saveLoginDetails,
          saveUserPreferences,
        },
        dispatch
      )
  ),
  setPropTypes({
    intl: intlShape.isRequired,
    loading: PropTypes.bool.isRequired,
    saving: PropTypes.bool.isRequired,
    accountDetails: PropTypes.shape({
      contactDetails: PropTypes.objectOf(ContactDetails),
      loginDetails: PropTypes.objectOf(LoginDetails),
      userPreferences: PropTypes.objectOf(UserPreferences),
    }).isRequired,
    showAcknowledgement: PropTypes.func.isRequired,
    fetchAccountDetails: PropTypes.func.isRequired,
    saveContactDetails: PropTypes.func.isRequired,
    saveLoginDetails: PropTypes.func.isRequired,
    saveUserPreferences: PropTypes.func.isRequired,
  })
)

export class AccountDetails extends PureComponent {
  state = {
    currentPasswordInputDialogOpen: false,
  }

  componentDidMount() {
    const { fetchAccountDetails } = this.props
    fetchAccountDetails()
  }

  componentWillReceiveProps(newProps) {
    if (
      newProps.accountDetails &&
      newProps.accountDetails.getIn([
        'loginDetails',
        'incorrectCurrentPasswordEntered',
      ])
    ) {
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
    const {
      intl: { formatMessage },
      loading,
      saving,
      accountDetails,
      saveContactDetails,
      saveUserPreferences,
      saveLoginDetails,
      showAcknowledgement,
    } = this.props
    const saveLoginDetailsFailed = errors => {
      if (!errors.currentPassword) {
        this.closeCurrentPasswordInputDialog()
      }
    }
    const saveLoginDetailsSucceeded = () => {
      this.closeCurrentPasswordInputDialog()
      showAcknowledgement({
        title: personDetailsMessages.detailsUpdatedSuccessfully,
        message: personDetailsMessages.loginDetailsUpdatedMessage,
      })
    }
    return (
      <div className={styles.Content}>
        <Helmet
          title={formatMessage(accountDetailsMessages.title)}
          titleTemplate="%s - Aspect"
          defaultTitle="Aspect"
        />
        <NavTitle title={formatMessage(accountDetailsMessages.title)} />
        <Paper>
          <Tabs>
            <Tab
              icon={<MapsPersonPin />}
              label={
                <Hidden xs component="span">
                  {formatMessage(personDetailsMessages.contactDetails)}
                </Hidden>
              }
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
              label={
                <Hidden xs component="span">
                  {formatMessage(accountDetailsMessages.usernameAndPassword)}
                </Hidden>
              }
            >
              {(loading || saving) && <LinearProgress />}
              <Visible xs component="h2" className={styles.Form__Header}>
                {formatMessage(accountDetailsMessages.usernameAndPassword)}
              </Visible>
              <LoginDetailsForm
                loading={loading || saving}
                initialValues={accountDetails.get('loginDetails')}
                currentPasswordInputDialogOpen={
                  this.state.currentPasswordInputDialogOpen
                }
                openCurrentPasswordInputDialog={
                  this.openCurrentPasswordInputDialog
                }
                closeCurrentPasswordInputDialog={
                  this.closeCurrentPasswordInputDialog
                }
                onSubmit={saveLoginDetails}
                onSubmitFail={saveLoginDetailsFailed}
                onSubmitSuccess={saveLoginDetailsSucceeded}
              />
            </Tab>
            <Tab
              icon={<Language />}
              label={
                <Hidden xs component="span">
                  {formatMessage(personDetailsMessages.languageAndTimezone)}
                </Hidden>
              }
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

export default enhance(AccountDetails)
