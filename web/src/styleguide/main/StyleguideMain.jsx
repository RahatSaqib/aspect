// Imports from packages
import _ from 'lodash'
import Immutable from 'immutable'
import React, { PureComponent } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { injectIntl, defineMessages, intlShape } from 'react-intl'
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
    defaultMessage: 'Styleguide',
  },
  filterTemplate: {
    id: 'pages.ManageDevices.filterTemplate',
    defaultMessage: 'Viewing all devices<GEOGRAPHY><NAME>.',
  },
  filterTemplateOptional: {
    id: 'pages.ManageDevices.filterTemplateOptional',
    defaultMessage: 'Counting only <ASSAY> assays<RESULT><DATE>.',
  },
})

const enhance = compose(
  pure,
  injectIntl,
  setPropTypes({
    intl: intlShape.isRequired,
  })
)

export class StyleguideMain extends PureComponent {
  state = {
    filter: {},
    countryId: null,
    stateId: null,
    lgaId: null,
  }

  handleChangeFilter = filter => {
    this.setState({ filter })
  }

  handleChangeCountry = countryId => {
    this.setState({ countryId })
  }

  handleChangeState = stateId => {
    this.setState({ stateId })
  }

  handleChangeLga = lgaId => {
    this.setState({ lgaId })
  }

  render() {
    const { intl } = this.props
    const { formatMessage } = intl

    return (
      <div className={styles.Content}>
        <Helmet
          title={formatMessage(messages.title)}
          titleTemplate="%s - Aspect"
          defaultTitle="Aspect"
        />
        <h1>Styleguide</h1>
        <ListFilter
          intl={intl}
          onClearFilter={_.noop}
          onChangeFilter={this.handleChangeFilter}
          listFilter={Immutable.fromJS(this.state.filter)}
          filterTemplate={formatMessage(messages.filterTemplate)}
          filterTemplateOptional={formatMessage(
            messages.filterTemplateOptional
          )}
          defaultExpanded
          config={{
            assayAndResultCategory: true,
            geography: true,
            date: true,
            deviceName: true,
            siteName: true,
            contactNameOrEmail: true,
          }}
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

export default enhance(StyleguideMain)
