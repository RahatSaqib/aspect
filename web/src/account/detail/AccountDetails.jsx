import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { injectIntl, defineMessages } from 'react-intl'
import _ from 'lodash'
import { connect } from 'react-redux'
import LinearProgress from 'material-ui/LinearProgress'
import Paper from 'material-ui/Paper'
import {Tabs, Tab} from 'material-ui/Tabs'
import MapsPersonPin from 'material-ui/svg-icons/maps/person-pin'
import Language from 'material-ui/svg-icons/action/language'
import Lock from 'material-ui/svg-icons/action/lock'
import ContactDetailsForm from './ContactDetailsForm'
import LoginDetailsForm from './LoginDetailsForm'
import {
  fetchAccountDetails,
  saveContactDetails,
  saveLoginDetails,
  saveUserPreferences
} from '../AccountRedux'
import styles from './AccountDetails.css'

const messages = defineMessages({
  title: {
    id: 'pages.AccountDetails.title',
    defaultMessage: 'Account Details'
  },
  contactDetails: {
    id: 'pages.AccountDetails.contactDetails',
    defaultMessage: 'Contact Details'
  },
  usernameAndPassword: {
    id: 'pages.AccountDetails.usernameAndPassword',
    defaultMessage: 'Username & Password'
  },
  languageAndTimezone: {
    id: 'pages.AccountDetails.languageAndTimezone',
    defaultMessage: 'Language & Timezone'
  }
})

class AccountDetails extends PureComponent {

  static propTypes = {
    setPageTitle: PropTypes.func.isRequired
  }

  componentWillMount() {
    const { setPageTitle, intl } = this.props
    const { formatMessage } = intl
    setPageTitle(formatMessage(messages.title))
  }

  componentDidMount() {
    const {fetchAccountDetails} = this.props
    fetchAccountDetails()
  }

  render() {
    const { formatMessage } = this.props.intl
    const { loading, saving, accountDetails, saveContactDetails,
      saveLoginDetails } = this.props
    return (
      <div className={styles.Content}>
        <Paper>
          <Tabs>
            <Tab className={styles.ResponsiveTab} icon={<MapsPersonPin />}
                 label={<span className="pure-hidden-xs">{formatMessage(messages.contactDetails)}</span>}>
              {(loading || saving) && <LinearProgress />}
              <h2 className={'pure-visible-xs ' + styles.Form__Header}>{formatMessage(messages.contactDetails)}</h2>
              {!loading && <ContactDetailsForm loading={loading || saving} initialValues={accountDetails} onSubmit={saveContactDetails} />}
            </Tab>
            <Tab className={styles.ResponsiveTab} icon={<Lock />}
                 label={<span className="pure-hidden-xs">{formatMessage(messages.usernameAndPassword)}</span>}>
              {(loading || saving) && <LinearProgress />}
              <h2 className={'pure-visible-xs ' + styles.Form__Header}>{formatMessage(messages.usernameAndPassword)}</h2>
              {!loading && <LoginDetailsForm loading={loading || saving} initialValues={accountDetails} onSubmit={saveLoginDetails} />}
            </Tab>
            <Tab className={styles.ResponsiveTab} icon={<Language />}
                 label={<span className="pure-hidden-xs">{formatMessage(messages.languageAndTimezone)}</span>}>
              {(loading || saving) && <LinearProgress />}
              <h2 className={'pure-visible-xs ' + styles.Form__Header}>{formatMessage(messages.languageAndTimezone)}</h2>
              <span>Timezone and Language Here!</span>
            </Tab>
          </Tabs>
        </Paper>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    loading: state.accountDetails.get('loading'),
    saving: state.accountDetails.get('saving'),
    accountDetails: state.accountDetails.get('data')
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchAccountDetails,
    saveContactDetails,
    saveLoginDetails,
    saveUserPreferences
  }, dispatch)
}

export const AccountDetailsContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(AccountDetails)
