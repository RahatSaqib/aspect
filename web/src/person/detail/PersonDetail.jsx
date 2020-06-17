import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import { compose, setPropTypes } from 'recompose'
import { injectIntl } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'

// Material-UI
import Paper from '@material-ui/core/Paper'
import LinearProgress from '@material-ui/core/LinearProgress'
import ContactDetailsForm from './ContactDetailsForm'
import LoginDetailsForm from './LoginDetailsForm'
import JobAssignmentForm from './JobAssignmentForm'
import PersonDetailBackBar from './PersonDetailsBackBar'

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
  addPersonAssignment,
  fetchPersonAssignments,
  deletePersonAssignment,
} from '../PersonRedux'
import { fetchPartnersAndJobFunctionsForSelectList } from '../../job/JobRedux'
import { showAcknowledgement } from '../../appNotification/AppNotificationRedux'
import PropTypeOf from '../../shared/types'

import messages from './messages'
import styles from './PersonDetail.css'

const enhance = compose(
  injectIntl,
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

      const partnersAndJobFunctionsForSelectList = state.jobs.get(
        'partnersAndJobFunctionsForSelectList'
      )
      const jobFunctions = partnersAndJobFunctionsForSelectList.getIn([
        'partners',
        0,
        'jobFunctions',
      ])

      return {
        editable: isEditable(state.user, 'person'),
        isNew,
        person,
        canLogIn: person && !!person.get('canLogIn'),
        user: state.user,
        emailValue: person && person.get('email'),
        prefillUser,
        partnersAndJobFunctionsForSelectList,
        jobFunctions,
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
          addPersonAssignment,
          fetchPersonAssignments,
          deletePersonAssignment,
        },
        dispatch
      )
  ),
  setPropTypes({
    intl: PropTypeOf.intl.isRequired,
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
    addPersonAssignment: PropTypes.func.isRequired,
    deletePersonAssignment: PropTypes.func.isRequired,
  })
)

export class PersonDetail extends PureComponent {
  componentDidMount() {
    this.handleFetchPartnersAndJobFunctions(this.props)
    this.handleFetchPerson(this.props)
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.personId !== prevProps.match.params.personId) {
      this.handleFetchPerson(this.props)
    }
  }

  handleFetchPerson = ({
    match,
    fetchSinglePerson,
    fetchPersonAssignments,
    isNew,
  }) => {
    if (isNew) return
    fetchSinglePerson(match.params.personId, () => {
      fetchPersonAssignments(match.params.personId)
    })
  }

  handlePersonCanLogIn = canLogin => {
    const { person } = this.props
    this.props.personCanLogIn(canLogin, person.get('id'))
  }

  handleEmailBlur = value => {
    const { person } = this.props
    if (person.get('id')) {
      this.props.emailValueBlur(value, person.get('id'))
    }
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

  addAssignment = values => {
    const { person, addPersonAssignment } = this.props
    const data = {
      personId: person.get('id'),
      ..._.pick(values, [
        'jobFunctionId',
        'countryId',
        'stateId',
        'lgaId',
        'siteId',
        'diseaseId',
        'deviceTypeId',
        'assayTypeId',
        'assayId',
      ]),
    }
    return addPersonAssignment(data)
  }

  deleteAssignment = jobContextId => {
    const { person, deletePersonAssignment } = this.props
    const data = {
      personId: person.get('id'),
      jobContextId,
    }
    deletePersonAssignment(data)
  }

  render() {
    const {
      intl,
      person,
      user,
      editable,
      isNew,
      jobFunctions,
      match,
      history,
      location,
    } = this.props
    const { formatMessage } = intl
    const contactDetails = new ContactDetails(person)
    const loginDetails = new LoginDetails(person)
    const userPreferences = new UserPreferences(person)
    const userIsAdmin = user.jwt.permissions.includes('person:admin')
    const loading = !isNew && (!person || person.get('loaded') !== true)
    const canLogIn = person && !!person.get('canLogIn')
    const shouldPrefill = !isNew && person && person.get('userId') == null
    const emailValue = (person && person.get('email')) || ''
    const assignments = (person && person.get('assignments')) || []
    const loadedAssignments = person && !!person.get('loadedAssignments')

    return (
      <div className={styles.Container}>
        <Helmet title={formatMessage(messages.title)} />
        <NavTitle title={formatMessage(messages.title)} />
        <Switch>
          <Route
            exact
            path={match.path}
            render={props =>
              editable ? (
                <div>
                  {!isNew && !person && <LinearProgress />}
                  {loading && <LinearProgress />}

                  <PersonDetailBackBar
                    formatMessage={formatMessage}
                    history={history}
                    location={location}
                    match={match}
                    {...props}
                    isNew={isNew}
                    title={isNew ? 'Add Contact' : person && person.get('name')}
                    canUserLoggedIn={!isNew && userIsAdmin && canLogIn}
                  />
                  <Paper className={styles.ContactDetailsForm}>
                    <ContactDetailsForm
                      intl={intl}
                      loading={loading}
                      onEmailBlur={this.handleEmailBlur}
                      contactDetails={contactDetails}
                      showNotesField
                      userIsAdmin
                      isUserChange={this.handlePersonCanLogIn}
                      onSubmit={this.saveContactDetails}
                      userPreferences={userPreferences}
                      saveUserPreferences={this.saveUserPreferences}
                    />
                  </Paper>
                </div>
              ) : (
                <Redirect to={match.url} />
              )
            }
          />
          <Route
            exact
            path={`${match.path}/system-access-control`}
            render={props => (
              <div>
                {loading && <LinearProgress />}

                <PersonDetailBackBar
                  formatMessage={formatMessage}
                  history={history}
                  location={location}
                  match={match}
                  {...props}
                  isNew={isNew}
                  title={person && person.get('name')}
                  canUserLoggedIn={!isNew && userIsAdmin && canLogIn}
                />

                <Paper className={styles.ContactDetailsForm}>
                  <LoginDetailsForm
                    intl={intl}
                    loading={loading}
                    shouldPrefill={shouldPrefill}
                    emailValue={emailValue}
                    loginDetails={loginDetails}
                    onSubmit={this.saveLoginDetails}
                  />
                </Paper>
              </div>
            )}
          />
          <Route
            exact
            path={`${match.path}/job-assignment`}
            render={props => (
              <div>
                {loading && <LinearProgress />}

                <PersonDetailBackBar
                  formatMessage={formatMessage}
                  history={history}
                  location={location}
                  match={match}
                  {...props}
                  isNew={isNew}
                  title={person && person.get('name')}
                  canUserLoggedIn={!isNew && userIsAdmin && canLogIn}
                />

                <Paper className={styles.ContactDetailsForm}>
                  <JobAssignmentForm
                    intl={intl}
                    loading={loading}
                    contactDetails={contactDetails}
                    shouldPrefill={shouldPrefill}
                    emailValue={emailValue}
                    countryId={user.get('countryId')}
                    onSubmit={this.addAssignment}
                    onDeleteAssignment={this.deleteAssignment}
                    jobFunctions={jobFunctions}
                    assignments={assignments}
                    loadedAssignments={loadedAssignments}
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

export default enhance(PersonDetail)
