import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes } from 'recompose'
import { intlShape } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Material-UI
import Paper from '@material-ui/core/Paper'
import Tab from '@material-ui/core/Tab'
import LinearProgress from '@material-ui/core/LinearProgress'
import MapsPersonPin from '@material-ui/icons/PersonPinRounded'
import Language from '@material-ui/icons/Language'
import Lock from '@material-ui/icons/Lock'
import ContactDetailsForm from './ContactDetailsForm'
import LoginDetailsForm from './LoginDetailsForm'
import UserPreferencesForm from './UserPreferencesForm'

// Our own imports
import AspectTabs from '../../components/shared/AspectTabs'
import { Hidden, Visible } from '../../components/pureGrids'
import NavTitle from '../../globals/components/NavTitle'
import isEditable from '../../shared/selectors/isEditable'
import {
  fetchSinglePerson,
  createPerson,
  updateSinglePerson,
  updateSinglePersonLoginDetails,
  updateSinglePersonUserPreferences,
  ContactDetails,
  LoginDetails,
  UserPreferences,
  personCanLogIn,
  emailValueBlur,
} from '../PersonRedux'
import { fetchPartnersAndJobFunctionsForSelectList } from '../../job/JobRedux'
import { showAcknowledgement } from '../../appNotification/AppNotificationRedux'

import messages from './messages'
import styles from './PersonDetail.css'

const enhance = compose(
  setPropTypes({
    match: PropTypes.shape({
      params: PropTypes.shape({
        personId: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }),
  connect(
    (state, props) => {
      let { personId } = props.match.params
      if (personId === 'add') {
        personId = undefined
      }
      const isNew = !personId
      const { personNew, items } = state.person
      const person = isNew ? personNew : items.byId.get(personId)
      const prefillUser = person && person.get('userId') > 0
      return {
        editable: isEditable(state.user, 'person'),
        isNew,
        person,
        canLogIn: person && !!person.get('canLogIn'),
        user: state.user,
        emailValue: person && person.get('email'),
        prefillUser,
        partnersAndJobFunctionsForSelectList: state.jobs.get(
          'partnersAndJobFunctionsForSelectList'
        ),
      }
    },
    dispatch =>
      bindActionCreators(
        {
          showAcknowledgement,
          fetchSinglePerson,
          createPerson,
          updateSinglePerson,
          updateSinglePersonLoginDetails,
          updateSinglePersonUserPreferences,
          fetchPartnersAndJobFunctionsForSelectList,
          personCanLogIn,
          emailValueBlur,
        },
        dispatch
      )
  ),
  setPropTypes({
    intl: intlShape.isRequired,
    editable: PropTypes.bool.isRequired,
    user: PropTypes.object.isRequired,
    person: PropTypes.object.isRequired,
    showAcknowledgement: PropTypes.func.isRequired,
    fetchSinglePerson: PropTypes.func.isRequired,
    createPerson: PropTypes.func.isRequired,
    updateSinglePerson: PropTypes.func.isRequired,
    updateSinglePersonLoginDetails: PropTypes.func.isRequired,
    updateSinglePersonUserPreferences: PropTypes.func.isRequired,
    fetchPartnersAndJobFunctionsForSelectList: PropTypes.func.isRequired,
    isNew: PropTypes.bool.isRequired,
  })
)

export class PersonDetail extends PureComponent {
  componentDidMount() {
    this.handleFetchPartnersAndJobFunctions(this.props)
    this.handleFetchPerson(this.props)
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.match.params.personId !== nextProps.match.params.personId) {
      this.handleFetchPerson(nextProps)
    }
  }

  handleFetchPerson = ({ match, fetchSinglePerson, isNew }) => {
    if (isNew) return
    fetchSinglePerson(match.params.personId)
  }

  handlePersonCanLogIn = canLogin => {
    const { person } = this.props
    this.props.personCanLogIn(canLogin, person.get('id'))
  }

  handleEmailBlur = value => {
    const { person } = this.props
    this.props.emailValueBlur(value, person.get('id'))
  }

  handleFetchPartnersAndJobFunctions = ({
    fetchPartnersAndJobFunctionsForSelectList,
  }) => {
    fetchPartnersAndJobFunctionsForSelectList()
  }

  saveContactDetails = values => {
    const { person, updateSinglePerson, isNew, createPerson } = this.props
    if (isNew) {
      return createPerson(values).then(person => {
        this.props.showAcknowledgement({
          title: messages.detailsCreatedSuccessfully,
          message: messages.contactDetailsCreatedMessage,
        })
        // replace current url to show just added contact for editing other tabs
        this.props.history.replace(`/browse/person/${person.id}`)
      })
    }
    const contactDetails = new ContactDetails(person)
    return updateSinglePerson(contactDetails.get('id'), values).then(() => {
      this.props.showAcknowledgement({
        title: messages.detailsUpdatedSuccessfully,
        message: messages.contactDetailsUpdatedMessage,
      })
    })
  }

  saveLoginDetails = ({ username, newPassword, userLockedOut }) => {
    const { person, updateSinglePersonLoginDetails } = this.props
    const loginDetails = new LoginDetails(person)
    return updateSinglePersonLoginDetails(loginDetails.get('id'), {
      newUsername: username,
      newPassword,
      userLockedOut,
    }).then(() => {
      this.props.showAcknowledgement({
        title: messages.detailsUpdatedSuccessfully,
        message: messages.loginDetailsUpdatedMessage,
      })
    })
  }

  saveUserPreferences = values => {
    const { person, updateSinglePersonUserPreferences } = this.props
    const userPreferences = new UserPreferences(person)
    return updateSinglePersonUserPreferences(
      userPreferences.get('id'),
      values
    ).then(() => {
      this.props.showAcknowledgement({
        title: messages.detailsUpdatedSuccessfully,
        message: messages.userPreferencesUpdatedMessage,
      })
    })
  }
  render() {
    const { intl, person, user, editable, isNew } = this.props
    const { formatMessage } = intl
    const contactDetails = new ContactDetails(person)
    const loginDetails = new LoginDetails(person)
    const userPreferences = new UserPreferences(person)
    const userIsAdmin = user.jwt.permissions.includes('person:admin')
    const loading = !isNew && (!person || person.get('loaded') !== true)
    // const isUser = !person || person.get('canLogIn') || undefined
    const isUser = !person || !!person.get('canLogIn')
    const shouldPrefill = !isNew && person && person.get('userId') == null
    const emailValue = (person && person.get('email')) || ''
    return (
      <div className={styles.Container}>
        <Helmet title={formatMessage(messages.title)} />
        <NavTitle title={formatMessage(messages.title)} />
        <Paper>
          {editable && (
            <AspectTabs fullWidth>
              <Tab
                icon={<MapsPersonPin fontSize="large" />}
                label={
                  <Hidden xs component="span">
                    {formatMessage(messages.contactDetails)}
                  </Hidden>
                }
              >
                {!isNew && !person && <LinearProgress />}
                {loading && <LinearProgress />}
                <Visible xs component="h2" className={styles.Form__Header}>
                  {formatMessage(messages.contactDetails)}
                </Visible>
                <ContactDetailsForm
                  intl={intl}
                  loading={loading}
                  onEmailBlur={this.handleEmailBlur}
                  contactDetails={contactDetails}
                  showNotesField
                  userIsAdmin
                  isUserChange={this.handlePersonCanLogIn}
                  onSubmit={this.saveContactDetails}
                />
              </Tab>
              <Tab
                icon={<Language fontSize="large" />}
                style={{
                  visibility: isNew ? 'hidden' : 'visible',
                }}
                label={
                  <Hidden xs component="span">
                    {formatMessage(messages.languageAndTimezone)}
                  </Hidden>
                }
              >
                {loading && <LinearProgress />}
                <Visible xs component="h2" className={styles.Form__Header}>
                  {formatMessage(messages.languageAndTimezone)}
                </Visible>
                <UserPreferencesForm
                  intl={intl}
                  loading={loading}
                  userPreferences={userPreferences}
                  onSubmit={this.saveUserPreferences}
                />
              </Tab>
              <Tab
                icon={<Lock fontSize="large" />}
                style={{
                  visibility:
                    !isNew && userIsAdmin && isUser ? 'visible' : 'hidden',
                }}
                label={
                  <Hidden xs component="span">
                    {formatMessage(messages.systemAccessControl)}
                  </Hidden>
                }
              >
                {loading && <LinearProgress />}
                <Visible xs component="h2" className={styles.Form__Header}>
                  {formatMessage(messages.systemAccessControl)}
                </Visible>
                <LoginDetailsForm
                  intl={intl}
                  loading={loading}
                  shouldPrefill={shouldPrefill}
                  emailValue={emailValue}
                  loginDetails={loginDetails}
                  onSubmit={this.saveLoginDetails}
                />
              </Tab>
            </AspectTabs>
          )}
        </Paper>
      </div>
    )
  }
}

export default enhance(PersonDetail)
