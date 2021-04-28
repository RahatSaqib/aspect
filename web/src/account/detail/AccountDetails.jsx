import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes } from 'recompose'
import { bindActionCreators } from 'redux'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { Switch, Route } from 'react-router-dom'
import LinearProgress from '@material-ui/core/LinearProgress'
import { injectIntl } from 'react-intl'
import Paper from '@material-ui/core/Paper'

import NavTitle from '../../globals/components/NavTitle'
import ContactDetailsForm from '../../person/detail/ContactDetailsForm'
import LoginDetailsForm from '../../person/detail/LoginDetailsForm'
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
import AccountDetailsBackBar from './AccountDetailsBackBar'
import {
  setTimezoneId,
  setCurrentCulture,
} from '../../globals/sideEffects/LocalStorage'

const enhance = compose(
  injectIntl,
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
  constructor(props) {
    super(props)

    this.state = {
      currentPasswordInputDialogOpen: false,
    }
  }

  componentDidMount() {
    const { fetchAccountDetails } = this.props
    fetchAccountDetails()
    this.componentDidUpdate()
  }

  // FIXME: `incorrectCurrentPasswordEntered` is not a valid field in the `loginDetails`
  componentDidUpdate() {
    if (
      this.props.accountDetails &&
      this.props.accountDetails.getIn([
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

  handleSaveContactDetails = values => {
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

    const value = {
      timezone: values.timezone,
      culture: values.culture,
    }

    setTimezoneId(value.timezone)
    setCurrentCulture(values.culture)

    return this.handleSaveUserPreferences(value)
  }

  handleSaveLoginDetails = values =>
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

  handleSaveUserPreferences = values => {
    this.props.saveUserPreferences({
      id: this.props.accountDetails.getIn(['userPreferences', 'id']),
      ...values,
    })
  }

  render() {
    const {
      intl,
      loading,
      saving,
      accountDetails,
      history,
      location,
      match,
    } = this.props
    const { formatMessage } = intl

    return (
      <div className={styles.Container}>
        <Helmet title={formatMessage(accountDetailsMessages.title)} />
        <NavTitle title={formatMessage(accountDetailsMessages.title)} />

        <Switch>
          <Route
            exact
            path={match.path}
            render={props => (
              <div>
                {(loading || saving) && <LinearProgress />}
                <AccountDetailsBackBar
                  formatMessage={formatMessage}
                  history={history}
                  location={location}
                  match={match}
                  title={
                    accountDetails &&
                    accountDetails.get('contactDetails').get('name')
                  }
                  {...props}
                />
                <Paper className={styles.AddMargin}>
                  <ContactDetailsForm
                    intl={intl}
                    canModify={false}
                    loading={loading || saving}
                    contactDetails={accountDetails.get('contactDetails')}
                    onSubmit={this.handleSaveContactDetails}
                    userPreferences={accountDetails.get('userPreferences')}
                    saveUserPreferences={this.handleSaveUserPreferences}
                  />
                </Paper>
              </div>
            )}
          />
          <Route
            exact
            path={`${match.path}/system-access-control`}
            render={props => (
              <div>
                {(loading || saving) && <LinearProgress />}
                <AccountDetailsBackBar
                  formatMessage={formatMessage}
                  history={history}
                  location={location}
                  match={match}
                  title={
                    accountDetails &&
                    accountDetails.get('contactDetails').get('name')
                  }
                  {...props}
                />
                <Paper className={styles.AddMargin}>
                  <LoginDetailsForm
                    intl={intl}
                    loading={loading || saving}
                    canModify={false}
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
                </Paper>
              </div>
            )}
          />
        </Switch>
      </div>
    )
  }
}

export default enhance(AccountDetails)
