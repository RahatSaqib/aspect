// Imports from packages
import _ from 'lodash'
import React, { PureComponent } from 'react'
import {
  injectIntl,
  defineMessages,
  intlShape
} from 'react-intl'
import { withRouter } from 'react-router'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Helmet from 'react-helmet'

// Our own imports
import CountrySelectField from '../../filter/geography/CountrySelectField'
import StateSelectField from '../../filter/geography/StateSelectField'
import LgaSelectField from '../../filter/geography/LgaSelectField'
import { ListFilter } from '../../filter/list/ListFilter'
import styles from './StyleguideMain.css'

const messages = defineMessages({
  title: {
    id: 'pages.StyleguideMain.title',
    defaultMessage: 'Styleguide'
  }
})

export class StyleguideMain extends PureComponent {
  static propTypes = {
    intl: intlShape
  }

  static defaultProps = {
    intl: null
  }

  state = {
    filter: {},
    countryId: null,
    stateId: null,
    lgaId: null
  }

  handleChangeFilter = (filter) => {
    this.setState({ filter })
  }

  handleChangeCountry = (countryId) => {
    this.setState({ countryId })
  }

  handleChangeState = (stateId) => {
    this.setState({ stateId })
  }

  handleChangeLga = (lgaId) => {
    this.setState({ lgaId })
  }

  render() {
    const { intl } = this.props
    const { formatMessage } = intl

    return (
      <div className={styles.Content}>
        <Helmet title={formatMessage(messages.title)} titleTemplate="%s - Aspect" defaultTitle="Aspect" />
        <h1>Styleguide</h1>
        <ListFilter
          onClearFilter={_.noop}
          onChangeFilter={this.handleChangeFilter}
          filter={this.state.filter}
          defaultExpanded
          config={{ assayAndResultCategory: true,
            geography: true,
            date: true,
            deviceName: true,
            siteName: true,
            contactNameOrEmail: true }}
        />
        <CountrySelectField
          onChangeCountry={this.handleChangeCountry}
          countryId={this.state.countryId}
        />
        <StateSelectField
          onChangeState={this.handleChangeState}
          countryId={this.state.countryId}
          stateId={this.state.stateId}
        />
        <LgaSelectField
          onChangeLga={this.handleChangeLga}
          countryId={this.state.countryId}
          stateId={this.state.stateId}
          lgaId={this.state.lgaId}
        />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    state
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
  }, dispatch)
}

export const StyleguideMainContainer = _.flowRight(
  injectIntl,
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(StyleguideMain)
