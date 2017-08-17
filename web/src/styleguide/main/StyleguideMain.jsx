import _ from 'lodash'
import React, { PureComponent } from 'react'
import { compose, setPropTypes, pure } from 'recompose'
import { injectIntl, defineMessages, intlShape } from 'react-intl'
import Helmet from 'react-helmet'

// Our own imports
import FallbackUntilDone from '../../components/shared/FallbackUntilDone'
import CountrySelectField from '../../filter/geography/CountrySelectField'
import StateSelectField from '../../filter/geography/StateSelectField'
import LgaSelectField from '../../filter/geography/LgaSelectField'
import FiltersPanel from '../../filter/popover/FiltersPanel'
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
    this.setState(state => ({
      filter: {
        ...state.filter,
        ...filter,
      },
    }))
  }

  handleCountryIdChange = countryId => {
    this.setState({ countryId })
  }

  handleStateIdChange = stateId => {
    this.setState({ stateId })
  }

  handleLgaIdChange = lgaId => {
    this.setState({ lgaId })
  }

  render() {
    const { intl } = this.props
    const { formatMessage } = intl

    return (
      <div className={styles.Container}>
        <Helmet title={formatMessage(messages.title)} />
        <h1>Styleguide</h1>
        <FallbackUntilDone
          fallbacks={[
            { style: { width: '100px' } },
            { style: { width: '200px' } },
            { style: { width: '300px' } },
          ]}
          isDone={node => node.getBoundingClientRect().width >= 400}
        >
          <div>98tyfchgvjbknl</div>
        </FallbackUntilDone>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <FiltersPanel
            intl={intl}
            onClearFilter={_.noop}
            onChangeFilters={this.handleChangeFilter}
            filters={this.state.filter}
            config={{
              assayAndResultCategory: true,
              geography: true,
              state: true, // under geography, optional
              lga: true, // under geography, optional
              date: true,
              partnerId: true,
              patientOrResearchId: true,
              sampleId: true,
              sampleGroup: true,
              deviceName: true,
              siteName: true,
              sampleOriginSite: true,
              contactNameOrEmail: true,
              consumable: true,
              workflowStatus: true,
              deviceStatus: true,
              externalId: true,
            }}
            contentClassName={styles.FiltersPanel__Content}
            filterTemplate={formatMessage(messages.filterTemplate)}
            filterTemplateOptional={formatMessage(
              messages.filterTemplateOptional
            )}
          />
        </div>
        <CountrySelectField
          onCountryIdChange={this.handleCountryIdChange}
          countryId={this.state.countryId}
        />
        <StateSelectField
          onStateIdChange={this.handleStateIdChange}
          countryId={this.state.countryId}
          stateId={this.state.stateId}
        />
        <LgaSelectField
          onLgaIdChange={this.handleLgaIdChange}
          countryId={this.state.countryId}
          stateId={this.state.stateId}
          lgaId={this.state.lgaId}
        />
      </div>
    )
  }
}

export default enhance(StyleguideMain)
