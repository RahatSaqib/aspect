import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { injectIntl, intlShape } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Material-UI
import Paper from 'material-ui/Paper'
import { Tabs, Tab } from 'material-ui/Tabs'
import LinearProgress from 'material-ui/LinearProgress'
import MapsPersonPin from 'material-ui/svg-icons/maps/person-pin'
import Language from 'material-ui/svg-icons/action/language'
import Lock from 'material-ui/svg-icons/action/lock'
import ContactDetailsForm from './ContactDetailsForm'
import LoginDetailsForm from './LoginDetailsForm'
import UserPreferencesForm from './UserPreferencesForm'

// Our own imports
import { Hidden, Visible } from '../../components/pureGrids'
import NavTitle from '../../globals/components/NavTitle'
import isEditable from '../../shared/selectors/person'
import {
  fetchSinglePerson,
  updateSinglePerson,
  updateSinglePersonLoginDetails,
  updateSinglePersonUserPreferences,
  ContactDetails,
  LoginDetails,
  UserPreferences,
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
  pure,
  injectIntl,
  connect(
    (state, props) => {
      const person = state.person.items.byId.get(props.match.params.personId)

      return {
        editable: isEditable(state.user, person),
        person,
        user: state.user,
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
          updateSinglePerson,
          updateSinglePersonLoginDetails,
          updateSinglePersonUserPreferences,
          fetchPartnersAndJobFunctionsForSelectList,
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
    updateSinglePerson: PropTypes.func.isRequired,
    updateSinglePersonLoginDetails: PropTypes.func.isRequired,
    updateSinglePersonUserPreferences: PropTypes.func.isRequired,
    fetchPartnersAndJobFunctionsForSelectList: PropTypes.func.isRequired,
  })
)

export class PersonDetail extends PureComponent {
  state = {
    partners: [],
    jobFunctions: [],
  }

  componentDidMount() {
    this.handleFetchPartnersAndJobFunctions(this.props)
    this.handleFetchPerson(this.props)
    if (this.props.partnersAndJobFunctionsForSelectList.get('lastRefreshed')) {
      this.setPartnerAndJobFunctions(
        this.props,
        this.props.person.get('partnerId')
      )
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.match.params.personId !== nextProps.match.params.personId) {
      this.handleFetchPerson(nextProps)
    } else if (
      nextProps.person &&
      nextProps.partnersAndJobFunctionsForSelectList.get('lastRefreshed')
    ) {
      this.setPartnerAndJobFunctions(
        nextProps,
        nextProps.person.get('partnerId')
      )
    }
  }

  setPartnerAndJobFunctions = (props, selectedPartnerId) => {
    const {
      partnersAndJobFunctionsForSelectList,
      intl: { formatMessage },
    } = props
    const partners = _.map(
      partnersAndJobFunctionsForSelectList.get('partners').toJS(),
      partner => ({
        id: partner.id,
        name: partner.name || formatMessage(messages.none),
        jobFunctions: _.map(partner.jobFunctions, jobFunction => ({
          id: jobFunction.id,
          name: jobFunction.name || formatMessage(messages.none),
        })),
      })
    )
    const selectedPartner = _.find(partners, { id: selectedPartnerId })
    const jobFunctions = selectedPartner ? selectedPartner.jobFunctions : []
    this.setState({
      partners,
      jobFunctions,
    })
  }

  handleFetchPerson = ({ match, fetchSinglePerson }) => {
    fetchSinglePerson(match.params.personId)
  }

  handleFetchPartnersAndJobFunctions = ({
    fetchPartnersAndJobFunctionsForSelectList,
  }) => {
    fetchPartnersAndJobFunctionsForSelectList()
  }

  saveContactDetails = formValues => {
    const { updateSinglePerson } = this.props
    return updateSinglePerson(formValues.get('id'), formValues)
  }

  saveLoginDetails = ({ username, newPassword }) => {
    const { person, updateSinglePersonLoginDetails } = this.props
    const loginDetails = new LoginDetails(person)
    return updateSinglePersonLoginDetails(loginDetails.get('id'), {
      newUsername: username,
      newPassword,
    }).then(() => {
      this.props.showAcknowledgement({
        title: messages.detailsUpdatedSuccessfully,
        message: messages.loginDetailsUpdatedMessage,
      })
    })
  }

  saveUserPreferences = formValues => {
    const { updateSinglePersonUserPreferences } = this.props
    return updateSinglePersonUserPreferences(formValues.get('id'), formValues)
  }

  render() {
    const { intl, person, user, editable, showAcknowledgement } = this.props
    const { formatMessage } = intl
    const contactDetails = new ContactDetails(person)
    const loginDetails = new LoginDetails(person)
    const userPreferences = new UserPreferences(person)
    const userIsAdmin = user.get('permissions').includes('person:admin')
    const loading = !person || person.get('loaded') !== true
    const saveContactDetailsSucceeded = () => {
      showAcknowledgement({
        title: messages.detailsUpdatedSuccessfully,
        message: messages.contactDetailsUpdatedMessage,
      })
    }
    const saveUserPreferencesSucceeded = () => {
      showAcknowledgement({
        title: messages.detailsUpdatedSuccessfully,
        message: messages.userPreferencesUpdatedMessage,
      })
    }

    return (
      <div className={styles.Content}>
        <Helmet
          title={formatMessage(messages.title)}
          titleTemplate="%s - Aspect"
          defaultTitle="Aspect"
        />
        <NavTitle title={formatMessage(messages.title)} />
        <Paper>
          {editable &&
            <Tabs>
              <Tab
                icon={<MapsPersonPin />}
                label={
                  <Hidden xs component="span">
                    {formatMessage(messages.contactDetails)}
                  </Hidden>
                }
              >
                {!person && <LinearProgress />}
                {loading && <LinearProgress />}
                <Visible xs component="h2" className={styles.Form__Header}>
                  {formatMessage(messages.contactDetails)}
                </Visible>
                <ContactDetailsForm
                  loading={loading}
                  initialValues={contactDetails}
                  partners={this.state.partners}
                  showNotesField
                  userIsAdmin
                  onSubmit={this.saveContactDetails}
                  onSubmitSuccess={saveContactDetailsSucceeded}
                />
              </Tab>
              {userIsAdmin &&
                <Tab
                  icon={<Lock />}
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
                    loginDetails={loginDetails}
                    onSubmit={this.saveLoginDetails}
                  />
                </Tab>}
              <Tab
                icon={<Language />}
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
                  initialValues={userPreferences}
                  onSubmit={this.saveUserPreferences}
                  onSubmitSuccess={saveUserPreferencesSucceeded}
                />
              </Tab>
            </Tabs>}
        </Paper>
      </div>
    )
  }
}

export default enhance(PersonDetail)
