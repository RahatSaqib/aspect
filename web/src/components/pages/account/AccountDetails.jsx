import _ from 'lodash'
import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import LinearProgress from 'material-ui/LinearProgress'
import Paper from 'material-ui/Paper'
import {Tabs, Tab} from 'material-ui/Tabs'
import ContactDetailsForm from './ContactDetailsForm'
import {fetchAccountDetails, saveAccountDetails} from '../../../action_creators/accountDetails_creators'
import {
  fetchCountriesSelectList,
  fetchStatesSelectList,
  fetchLgasSelectList
} from '../../../action_creators/geography_creators'
import styles from './AccountDetails.css'

class AccountDetails extends React.PureComponent {
  componentDidMount() {
    this.props.fetchAccountDetails()
    this.props.fetchCountriesSelectList()
  }

  onCountryChanged = this.onCountryChanged.bind(this)
  onCountryChanged(text, index){
    if(index > -1) {
      let countryItem = this.props.countriesSelectList.get('items').get(index)
      if(countryItem) {
        this.props.fetchStatesSelectList(countryItem.get('id'))
      }
    }
  }

  onStateChanged = this.onStateChanged.bind(this)
  onStateChanged(text, index) {
    if(index > -1) {
      let stateItem = this.props.statesSelectList.get('items').get(index)
      if (stateItem) {
        this.props.fetchLgasSelectList(stateItem.get('id'))
      }
    }
  }

  render() {
    const { loading, saving, accountDetails, saveAccountDetails, countriesSelectList, statesSelectList,
      lgasSelectList } = this.props
    return (
      <div className={styles.Content}>
        {loading && <span>Loading...</span>}
        {(loading || saving) && <LinearProgress />}
        {!loading &&
        <Paper>
          <Tabs>
            <Tab label="Contact Details">
              <ContactDetailsForm initialValues={accountDetails} onSubmit={saveAccountDetails}
                                  onCountryChanged={this.onCountryChanged}
                                  countriesLoading={countriesSelectList.get('loading')}
                                  countries={countriesSelectList.get('items')}
                                  onStateChanged={this.onStateChanged}
                                  statesLoading={statesSelectList.get('loading')}
                                  states={statesSelectList.get('items')}
                                  lgasLoading={lgasSelectList.get('loading')}
                                  lgas={lgasSelectList.get('items')}
                                  fetchStates={fetchCountriesSelectList}
                                  fetchLgas={fetchCountriesSelectList} />
            </Tab>
            <Tab label="Login Details">
              <span>Change Username and Password Here!</span>
            </Tab>
            <Tab label="User Preferences">
              <span>Timezone and Language Here!</span>
            </Tab>
          </Tabs>
        </Paper>}
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    loading: state.accountDetails.get('loading'),
    saving: state.accountDetails.get('saving'),
    loadingMessage: state.accountDetails.get('loadingMessage'),
    accountDetails: state.accountDetails.get('data'),
    countriesSelectList: state.geography.get('country').get('selectList'),
    statesSelectList: state.geography.get('state').get('selectList'),
    lgasSelectList: state.geography.get('lga').get('selectList')
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchAccountDetails,
    saveAccountDetails,
    fetchCountriesSelectList,
    fetchStatesSelectList,
    fetchLgasSelectList
  }, dispatch)
}

export const AccountDetailsContainer = _.flowRight(
  connect(mapStateToProps, mapDispatchToProps)
)(AccountDetails)
