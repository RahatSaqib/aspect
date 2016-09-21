// Imports from packages
import React from 'react'
import {injectIntl, defineMessages} from 'react-intl'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'
import _ from 'lodash'

// Material-UI
import Paper from 'material-ui/Paper'

import { fetchCurrentlyLoggedAccountDetails } from '../../../action_creators/account_details_creators'

const messages = defineMessages({
  title: {
    id: 'pages.AccountDetails.title',
    defaultMessage: 'Account Details'
  }
})

class AccountDetails extends React.PureComponent {
  handleFetchCurrentlyLoggedAccountDetails = () => {
    this.props.fetchCurrentlyLoggedAccountDetails()
  }

  componentDidMount() {
    this.handleFetchCurrentlyLoggedAccountDetails()
  }

  render() {
    const { formatMessage } = this.props.intl

    return (
      <div className="content">
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <div className="pure-g">
          <div className="pure-u-sm-11-12">
            <Paper>
              <h1>Account Details</h1>
              {this.props.accountDetails}
            </Paper>
          </div>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    accountDetails: state.accountDetails
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ fetchCurrentlyLoggedAccountDetails }, dispatch)
}

export const AccountDetailsContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(AccountDetails)
