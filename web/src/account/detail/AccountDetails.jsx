import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes } from 'recompose'
import { bindActionCreators } from 'redux'
import Helmet from 'react-helmet'
import { connect } from 'react-redux'
import LinearProgress from '@material-ui/core/LinearProgress'
import Paper from '@material-ui/core/Paper'
import { Tabs, Tab } from 'material-ui/Tabs'
import MapsPersonPin from '@material-ui/icons/PersonPinRounded'
import Language from '@material-ui/icons/Language'
import Lock from '@material-ui/icons/Lock'

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

  handleSaveContactDetails = values =>
    this.props.saveContactDetails({
      id: this.props.accountDetails.getIn(['contactDetails', 'id']),
      name: values.name,
      title: values.title,
      email: values.email,
      email2: values.email2,
      phone: values.phone,
      cell: values.cell,
      countryId: values.countryId,
      stateId: values.stateId,
      lgaId: values.lgaId,
      zip: values.zip,
    })

  handleSaveLoginDetails = values => {
    this.props.saveLoginDetails(values).then(
      () => {
        this.closeCurrentPasswordInputDialog()
        this.props.showAcknowledgement({
          title: personDetailsMessages.detailsUpdatedSuccessfully,
          message: personDetailsMessages.loginDetailsUpdatedMessage,
        })
      },
      errors => {
        if (!errors.currentPassword) {
          this.closeCurrentPasswordInputDialog()
        }
      }
    )
  }

  handleSaveUserPreferences = values =>
    this.props.saveUserPreferences({
      id: this.props.accountDetails.getIn(['userPreferences', 'id']),
      ...values,
    })

  render() {
    const { intl, loading, saving, accountDetails } = this.props
    const { formatMessage } = intl

    return (
      <div className={styles.Container}>
        <Helmet title={formatMessage(accountDetailsMessages.title)} />
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
                intl={intl}
                loading={loading || saving}
                contactDetails={accountDetails.get('contactDetails')}
                onSubmit={this.handleSaveContactDetails}
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
                intl={intl}
                loading={loading || saving}
                loginDetails={accountDetails.get('loginDetails')}
                currentPasswordInputDialogOpen={
                  this.state.currentPasswordInputDialogOpen
                }
                openCurrentPasswordInputDialog={
                  this.openCurrentPasswordInputDialog
                }
                closeCurrentPasswordInputDialog={
                  this.closeCurrentPasswordInputDialog
                }
                onSubmit={this.handleSaveLoginDetails}
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
                intl={intl}
                loading={loading || saving}
                userPreferences={accountDetails.get('userPreferences')}
                onSubmit={this.handleSaveUserPreferences}
              />
            </Tab>
          </Tabs>
        </Paper>
      </div>
    )
  }
}

export default enhance(AccountDetails)
