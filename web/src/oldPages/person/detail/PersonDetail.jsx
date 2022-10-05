import React, { PureComponent } from 'react'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import pick from 'lodash/pick'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { compose, setPropTypes } from 'recompose'
import ContactDetailsFormFormik from '../../../components/Account/Details'
import NavTitle from '../../../oldComponents/NavTitle'
import PermissionsProvider from '../../../providers/PermissionsProvider'
import { showAcknowledgement } from '../../../store/AppNotificationRedux'
import { fetchPartnersAndJobFunctionsForSelectList } from '../../../store/JobRedux'
import {
  fetchSinglePerson,
  createPerson,
  updateSinglePerson,
  updateSinglePersonLoginDetails,
  updateSinglePersonUserPreferences,
  ContactDetails,
  LoginDetails,
  personCanLogIn,
  emailValueBlur,
  addPersonAssignment,
  fetchPersonAssignments,
  deletePersonAssignment,
} from '../../../store/PersonRedux'
import isEditable from '../../../utils/selectors/isEditable'
import PropTypeOf from '../../../utils/types'
import JobAssignmentForm from './JobAssignmentForm'
import LoginDetailsForm from './LoginDetailsForm'
import messages from './messages'
import styles from './PersonDetail.css'
import PersonDetailBackBar from './PersonDetailsBackBar'

const enhance = compose(
  injectIntl,
  WrapperComponent => props => {
    const { personId } = useParams()
    return <WrapperComponent {...props} personId={personId} />
  },
  connect(
    (state, props) => {
      let { personId } = props
      if (personId === 'add') {
        personId = undefined
      }
      const isNew = !personId
      const { personNew, items } = state.person
      const person = isNew ? personNew : items.byId.get(personId)
      const prefillUser = person ? person.get('userId') > 0 : false

      const partnersAndJobFunctionsForSelectList = state.jobs.get('partnersAndJobFunctionsForSelectList')
      const jobFunctions = partnersAndJobFunctionsForSelectList.getIn(['partners', 0, 'jobFunctions'])

      return {
        editable: isEditable(state.user, 'person'),
        isNew,
        person: person || personNew,
        canLogIn: person && !!person.get('canLogIn'),
        user: state.user,
        emailValue: person && person.get('email'),
        prefillUser,
        partnersAndJobFunctionsForSelectList,
        jobFunctions,
      }
    },
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
    }
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
    if (this.props.personId !== prevProps.personId) {
      this.handleFetchPerson(this.props)
    }
  }

  handleFetchPerson = ({ personId, fetchSinglePerson, fetchPersonAssignments, isNew }) => {
    if (isNew) return
    fetchSinglePerson(personId, () => {
      fetchPersonAssignments(personId)
    })
  }

  handleFetchPartnersAndJobFunctions = ({ fetchPartnersAndJobFunctionsForSelectList }) => {
    fetchPartnersAndJobFunctionsForSelectList()
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

  addAssignment = values => {
    const { person, addPersonAssignment } = this.props
    const data = {
      personId: person.get('id'),
      ...pick(values, [
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
    const finalData = {
      ...data,
      assayId: +data.assayId,
    }
    return addPersonAssignment(finalData)
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
    const { intl, person, user, editable, isNew, jobFunctions, location } = this.props
    const { formatMessage } = intl
    const contactDetails = new ContactDetails(person)
    const loginDetails = new LoginDetails(person)
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
        <Routes>
          <Route
            path=""
            element={
              editable ? (
                <div>
                  {!isNew && !person && <LinearProgress />}
                  {loading && <LinearProgress />}
                  <PermissionsProvider permissions={['person:edit']}>
                    <PersonDetailBackBar
                      formatMessage={formatMessage}
                      {...this.props}
                      isNew={isNew}
                      title={isNew ? 'Add Contact' : person && person.get('name')}
                      canUserLoggedIn={!isNew && canLogIn}
                    />
                    <Paper className={styles.ContactDetailsForm}>
                      <ContactDetailsFormFormik />
                    </Paper>
                  </PermissionsProvider>
                </div>
              ) : (
                <Navigate replace to={location.pathname} />
              )
            }
          />
          <Route
            path="system-access-control"
            element={
              <div>
                {loading && <LinearProgress />}

                <PermissionsProvider permissions={['person:edit']}>
                  <PersonDetailBackBar
                    formatMessage={formatMessage}
                    {...this.props}
                    isNew={isNew}
                    title={person && person.get('name')}
                    canUserLoggedIn={!isNew && canLogIn}
                  />
                </PermissionsProvider>

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
            }
          />
          <Route
            path="job-assignment"
            element={
              <div>
                {loading && <LinearProgress />}

                <PermissionsProvider permissions={['person:edit']}>
                  <PersonDetailBackBar
                    formatMessage={formatMessage}
                    {...this.props}
                    isNew={isNew}
                    title={person && person.get('name')}
                    canUserLoggedIn={!isNew && canLogIn}
                  />
                </PermissionsProvider>

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
            }
          />
        </Routes>
      </div>
    )
  }
}

export default enhance(PersonDetail)
