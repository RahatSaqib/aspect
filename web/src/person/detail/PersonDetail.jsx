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

  handleFetchPerson = ({ params }) => {
    this.props.fetchSinglePerson(params.personId)
  }

  componentWillMount() {
    const { setPageTitle, intl } = this.props
    const { formatMessage } = intl
    setPageTitle(formatMessage(messages.title))
  }

  componentDidMount() {
    this.handleFetchPerson(this.props)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.params.personId !== nextProps.params.personId) {
      this.handleFetchPerson(nextProps)
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
                                           showRolesPanel />}
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
    user: state.user
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchSinglePerson,
    updateSinglePerson
  }, dispatch)
}

export const PersonDetailContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(PersonDetail)
