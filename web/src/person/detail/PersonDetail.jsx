// Imports from packages
import _ from 'lodash'
import React, { PureComponent, PropTypes } from 'react'
import { injectIntl } from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Material-UI
import Paper from 'material-ui/Paper'
import {Tabs, Tab} from 'material-ui/Tabs'
import LinearProgress from 'material-ui/LinearProgress'
import MapsPersonPin from 'material-ui/svg-icons/maps/person-pin'
import Language from 'material-ui/svg-icons/action/language'
import Lock from 'material-ui/svg-icons/action/lock'
import ContactDetailsForm from './ContactDetailsForm'
import LoginDetailsForm from './LoginDetailsForm'
import UserPreferencesForm from './UserPreferencesForm'

// Our own imports
import { isEditable } from '../../shared/selectors/person'
import {
  fetchSinglePerson,
  updateSinglePerson,
  ContactDetails,
  LoginDetails,
  UserPreferences
} from '../PersonRedux'
import {fetchPartnersAndRolesForSelectList} from '../../role/RoleRedux'

import messages from './messages'
import styles from './PersonDetail.css'

/*
 * This page component renders a single site
 */
export class PersonDetail extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired
  }

  state = {
    partners: [],
    orgUnits: [],
    roles: []
  }

  handleFetchPartnersAndRoles = ({partnersAndRolesForSelectList, fetchPartnersAndRolesForSelectList}) => {
    fetchPartnersAndRolesForSelectList(partnersAndRolesForSelectList)
  }

  handleFetchPerson = ({ params, fetchSinglePerson }) => {
    fetchSinglePerson(params.personId)
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
    } else if (nextProps.partnersAndRolesForSelectList.get('lastRefreshed')) {
      this.setPartnersOrgUnitsAndRoles(nextProps, nextProps.person.get('partnerId'), nextProps.person.get('orgUnitId'))
    }
  }

  partnerSelected = (event, target, value) => {
    this.setPartnersOrgUnitsAndRoles(this.props, value, this.props.person.get('orgUnitId'))
  }

  orgUnitSelected = (event, target, value) => {
    this.setPartnersOrgUnitsAndRoles(this.props, this.props.person.get('partnerId'), value)
  }

  setPartnersOrgUnitsAndRoles = (props, selectedPartnerId, selectedOrgUnitId) => {
    const {partnersAndRolesForSelectList, intl} = props,
      {formatMessage} = intl,
      partners = _.map(partnersAndRolesForSelectList.get('partners').toJS(), partner => {
        return{
          id: partner.id,
          name: partner.name || formatMessage(messages.noPartner),
          orgUnits: _.map(partner.orgUnits, orgUnit => {
            return {
              id: orgUnit.id,
              name: orgUnit.name || formatMessage(messages.noOrgUnit),
              roles: orgUnit.roles
            }
          })
        }
      }),
      selectedPartner = _.find(partners, {id: selectedPartnerId}) || _.find(partners, {id: undefined}),
      orgUnits = selectedPartner.orgUnits,
      selectedOrgUnit = _.find(selectedPartner.orgUnits, {id: selectedOrgUnitId}) || _.find(selectedPartner.orgUnits, {id: undefined}),
      roles = selectedOrgUnit.roles
    this.setState({
      partners,
      orgUnits,
      roles
    })
  }

  roleSelected = (event, isSelected) => {
    const roleId = parseInt(event.target.name)
    if(isSelected) {
      this.props.person.roles.push(roleId)
    } else {
      this.props.person.roles.splice(this.props.person.roles.indexOf(roleId), 1)
    }
  }

  saveContactDetails = formValues => {
    const {updateSinglePerson} = this.props
    return updateSinglePerson(formValues.get('id'), formValues)
  }

  saveLoginDetails = formValues => {
    console.log(formValues)
  }

  saveUserPreferences = formValues => {
    console.log(formValues)
  }

  render() {
    const {
        intl: { formatMessage },
        person, user, editable
      } = this.props,
      contactDetails = new ContactDetails(person),
      loginDetails = new LoginDetails(person),
      userPreferences = new UserPreferences(person),
      userIsAdmin = user.get('permissions').includes('person:admin')

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <Paper>
          {editable && <Tabs>
            <Tab icon={<MapsPersonPin />}
                 label={<span className="pure-hidden-xs">{formatMessage(messages.contactDetails)}</span>}>
              {(!person) && <LinearProgress />}
              <h2 className={'pure-visible-xs ' + styles.Form__Header}>
                {formatMessage(messages.contactDetails)}
              </h2>
              {person && <ContactDetailsForm initialValues={contactDetails} showNotesField
                                             onSubmit={this.saveContactDetails} />}
            </Tab>
            {userIsAdmin && <Tab icon={<Lock />}
                 label={<span className="pure-hidden-xs">{formatMessage(messages.systemAccessControl)}</span>}>
              {(!person) && <LinearProgress />}
              <h2 className={'pure-visible-xs ' + styles.Form__Header}>
                {formatMessage(messages.systemAccessControl)}
              </h2>
              {person && <LoginDetailsForm initialValues={loginDetails} onSubmit={this.saveLoginDetails}
                                           partners={this.state.partners} orgUnits={this.state.orgUnits}
                                           roles={this.state.roles} partnerSelected={this.partnerSelected}
                                           orgUnitSelected={this.orgUnitSelected} roleSelected={this.roleSelected} />}
            </Tab>}
            <Tab icon={<Language />}
                 label={<span className="pure-hidden-xs">{formatMessage(messages.languageAndTimezone)}</span>}>
              {(!person) && <LinearProgress />}
              <h2 className={'pure-visible-xs ' + styles.Form__Header}>
                {formatMessage(messages.languageAndTimezone)}
              </h2>
              {person && <UserPreferencesForm initialValues={userPreferences}
                                              onSubmit={this.saveUserPreferences} />}
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
    fetchPartnersAndRolesForSelectList
  }, dispatch)
}

export const PersonDetailContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(PersonDetail)
