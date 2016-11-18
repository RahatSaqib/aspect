// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { injectIntl } from 'react-intl'
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
import { Hidden } from '../../components/pureGrids'
import isEditable from '../../shared/selectors/person'
import {
  fetchSinglePerson,
  updateSinglePerson,
  updateSinglePersonLoginDetails,
  updateSinglePersonUserPreferences,
  ContactDetails,
  LoginDetails,
  UserPreferences
} from '../PersonRedux'
import { fetchPartnersAndRolesForSelectList } from '../../role/RoleRedux'
import { addAcknowledgement } from '../../acknowledgement/AcknowledgementRedux'

import messages from './messages'
import styles from './PersonDetail.css'

/*
 * This page component renders a single site
 */
export class PersonDetail extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    person: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    editable: PropTypes.bool.isRequired,
    addAcknowledgement: PropTypes.func.isRequired,
    partnersAndRolesForSelectList: PropTypes.object.isRequired,
    updateSinglePerson: PropTypes.func.isRequired,
    updateSinglePersonLoginDetails: PropTypes.func.isRequired,
    updateSinglePersonUserPreferences: PropTypes.func.isRequired
  }

  state = {
    partners: [],
    orgUnits: [],
    roles: []
  }

  componentWillMount() {
    const { setPageTitle, intl } = this.props
    const { formatMessage } = intl
    setPageTitle(formatMessage(messages.title))
  }

  componentDidMount() {
    this.handleFetchPartnersAndRoles(this.props)
    this.handleFetchPerson(this.props)
    if (this.props.partnersAndRolesForSelectList.get('lastRefreshed')) {
      this.setPartnersOrgUnitsAndRoles(this.props, this.props.person.get('partnerId'), this.props.person.get('orgUnitId'))
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.params.personId !== nextProps.params.personId) {
      this.handleFetchPerson(nextProps)
    } else if (nextProps.person && nextProps.partnersAndRolesForSelectList.get('lastRefreshed')) {
      this.setPartnersOrgUnitsAndRoles(nextProps, nextProps.person.get('partnerId'), nextProps.person.get('orgUnitId'))
    }
  }

  setPartnersOrgUnitsAndRoles = (props, selectedPartnerId, selectedOrgUnitId) => {
    const { partnersAndRolesForSelectList, intl: { formatMessage } } = props
    const partners = _.map(partnersAndRolesForSelectList.get('partners').toJS(), partner => ({
      id: partner.id,
      name: partner.name || formatMessage(messages.none),
      orgUnits: _.map(partner.orgUnits, orgUnit => ({
        id: orgUnit.id,
        name: orgUnit.name || formatMessage(messages.none),
        roles: orgUnit.roles
      }))
    }))
    const selectedPartner = _.find(partners, { id: selectedPartnerId }) ||
      _.find(partners, { id: undefined })
    const orgUnits = selectedPartner.orgUnits
    const selectedOrgUnit = _.find(selectedPartner.orgUnits, { id: selectedOrgUnitId }) ||
      _.find(selectedPartner.orgUnits, { id: undefined })
    const roles = selectedOrgUnit.roles
    this.setState({
      partners,
      orgUnits,
      roles
    })
  }

  handleFetchPerson = ({ params, fetchSinglePerson }) => {
    fetchSinglePerson(params.personId)
  }

  handleFetchPartnersAndRoles = ({ partnersAndRolesForSelectList,
    fetchPartnersAndRolesForSelectList }) => {
    fetchPartnersAndRolesForSelectList(partnersAndRolesForSelectList)
  }

  saveContactDetails = (formValues) => {
    const { updateSinglePerson } = this.props
    return updateSinglePerson(formValues.get('id'), formValues)
  }

  saveLoginDetails = (formValues) => {
    const { updateSinglePersonLoginDetails } = this.props
    return updateSinglePersonLoginDetails(formValues.get('id'), {
      newUsername: formValues.get('username'),
      newPassword: formValues.get('newPassword')
    })
  }

  saveUserPreferences = (formValues) => {
    const { updateSinglePersonUserPreferences } = this.props
    return updateSinglePersonUserPreferences(formValues.get('id'), formValues)
  }

  render() {
    const {
        intl: { formatMessage },
        person, user, editable, addAcknowledgement
      } = this.props
    const contactDetails = new ContactDetails(person)
    const loginDetails = new LoginDetails(person)
    const userPreferences = new UserPreferences(person)
    const userIsAdmin = user.get('permissions').includes('person:admin')
    const loading = !person || person.get('loaded') !== true
    const saveContactDetailsSucceeded = () => {
      addAcknowledgement(formatMessage(messages.contactDetailsUpdated))
    }
    const saveLoginDetailsSucceeded = () => {
      addAcknowledgement(formatMessage(messages.loginDetailsUpdated))
    }
    const saveUserPreferencesSucceeded = () => {
      addAcknowledgement(formatMessage(messages.userPreferencesUpdated))
    }

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <Paper>
          {editable && <Tabs>
            <Tab
              icon={<MapsPersonPin />}
              label={<Hidden xs component="span">{formatMessage(messages.contactDetails)}</Hidden>}
            >
              {(!person) && <LinearProgress />}
              {loading && <LinearProgress />}
              <h2 className={classNames('pure-visible-xs', styles.Form__Header)}>
                {formatMessage(messages.contactDetails)}
              </h2>
              <ContactDetailsForm
                loading={loading} initialValues={contactDetails} partners={this.state.partners}
                showNotesField userIsAdmin onSubmit={this.saveContactDetails}
                onSubmitSuccess={saveContactDetailsSucceeded}
              />
            </Tab>
            {userIsAdmin && <Tab
              icon={<Lock />}
              label={<Hidden xs component="span">{formatMessage(messages.systemAccessControl)}</Hidden>}
            >
              {loading && <LinearProgress />}
              <h2 className={classNames('pure-visible-xs', styles.Form__Header)}>
                {formatMessage(messages.systemAccessControl)}
              </h2>
              <LoginDetailsForm
                loading={loading} initialValues={loginDetails} onSubmit={this.saveLoginDetails}
                onSubmitSuccess={saveLoginDetailsSucceeded}
              />
            </Tab>}
            <Tab
              icon={<Language />}
              label={<Hidden xs component="span">{formatMessage(messages.languageAndTimezone)}</Hidden>}
            >
              {loading && <LinearProgress />}
              <h2 className={classNames('pure-visible-xs', styles.Form__Header)}>
                {formatMessage(messages.languageAndTimezone)}
              </h2>
              <UserPreferencesForm
                loading={loading} initialValues={userPreferences}
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

function mapStateToProps(state, { params }) {
  const person = state.person.items.byId.get(params.personId)

  return {
    editable: isEditable(state.user, person),
    person,
    user: state.user,
    partnersAndRolesForSelectList: state.roles.get('partnersAndRolesForSelectList')
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchSinglePerson,
    updateSinglePerson,
    updateSinglePersonLoginDetails,
    updateSinglePersonUserPreferences,
    fetchPartnersAndRolesForSelectList,
    addAcknowledgement
  }, dispatch)
}

export const PersonDetailContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(PersonDetail)
