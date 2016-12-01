// Imports from packages
import _ from 'lodash'
import Immutable from 'immutable'
import React, { PureComponent, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import {
  injectIntl,
  defineMessages
} from 'react-intl'

// Material-UI
import { Card, CardHeader, CardActions, CardText } from 'material-ui/Card'
import FlatButton from 'material-ui/FlatButton'

// Our own imports
import FocusBlurTextField from '../../components/shared/FocusBlurTextField'
import CountrySelectField from '../geography/CountrySelectField'
import StateSelectField from '../geography/StateSelectField'
import LgaSelectField from '../geography/LgaSelectField'
import AssaySelectField from '../resource/AssaySelectField'
import ResultCategorySelectField from '../resource/ResultCategorySelectField'
import ConsumableSelectField from '../resource/ConsumableSelectField'
import DateRangeSelector from '../date/DateRangeSelector'
import {
  clearListFilter,
  changeListFilter
} from '../FilterRedux'

import styles from './ListFilter.css'

const messages = defineMessages({
  noFilters: {
    id: 'shared.ListFilter.noFilters',
    defaultMessage: 'No filters set - showing all'
  }
})

export class ListFilter extends PureComponent {

  static propTypes = {
    onClearFilter: PropTypes.func.isRequired, // connect
    onChangeFilter: PropTypes.func.isRequired, // connect
    filter: PropTypes.shape({
      assayId: PropTypes.string,
      countryId: PropTypes.string,
      stateId: PropTypes.string,
      lgaId: PropTypes.string,
      minDate: PropTypes.string,
      maxDate: PropTypes.string,
      deviceName: PropTypes.string,
      resultCategoryId: PropTypes.string,
      siteName: PropTypes.string,
      contactNameOrEmail: PropTypes.string,
      consumableId: PropTypes.string
    }).isRequired, // connect
    intl: PropTypes.object.isRequired,
    defaultExpanded: PropTypes.bool,
    config: PropTypes.shape({
      assayAndResultCategory: PropTypes.bool,
      geography: PropTypes.bool, // country, state, lga
      date: PropTypes.bool,
      deviceName: PropTypes.bool,
      siteName: PropTypes.bool,
      contactNameOrEmail: PropTypes.bool,
      consumable: PropTypes.bool
    }).isRequired,
    subject: PropTypes.string
  }

  state = {
    expanded: !!this.props.defaultExpanded
  }

  handleExpandChange = (expanded) => {
    this.setState({ expanded })
  }

  handleToggle = (event, toggle) => {
    this.setState({ expanded: toggle })
  }

  handleAssayIdChange = (assayId) => {
    const nextFilter = {
      ...this.props.filter,
      assayId
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleChangeDate = (dateValues) => {
    const nextFilter = {
      ...this.props.filter,
      ...dateValues
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleChangeCountry = (countryId) => {
    const nextFilter = {
      ...this.props.filter,
      countryId,
      stateId: undefined,
      lgaId: undefined
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleChangeState = (stateId) => {
    const nextFilter = {
      ...this.props.filter,
      stateId,
      lgaId: undefined
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleChangeLga = (lgaId) => {
    const nextFilter = {
      ...this.props.filter,
      lgaId
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleResultCategoryChange = (resultCategoryId) => {
    const nextFilter = {
      ...this.props.filter,
      resultCategoryId
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleTextFieldCommitValue = (event) => {
    const nextFilter = {
      ...this.props.filter,
      [event.target.name]: event.target.value
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleConsumableIdChange = (consumableId) => {
    const nextFilter = {
      ...this.props.filter,
      consumableId
    }
    this.props.onChangeFilter(nextFilter)
  }

  render() {
    const { filter, config, subject, intl: { formatMessage } } = this.props
    const { expanded } = this.state
    const noFiltersMessage = `${formatMessage(messages.noFilters)} ${subject ? subject.toLowerCase() : ''}`
    const filterMessage = _.every(filter, f => !f) ? noFiltersMessage : `\`${JSON.stringify(filter)}\``
    const hasDataSection = (
      config.assay || config.deviceName || config.result ||
      config.siteName || config.contactNameOrEmail || config.consumable
    )

    return (
      <div className={styles.ListFilter}>
        <Card expanded={expanded} onExpandChange={this.handleExpandChange}>
          <CardHeader
            subtitle={filterMessage}
            actAsExpander
            showExpandableButton
          />
          <CardText expandable>
            {config.date && (
              <section className={styles.Section}>
                <h3 className={styles.Section__Title}>Date Range</h3>
                <div className={styles.Section__Content}>
                  <DateRangeSelector
                    clearButtonTooltip="Clear"
                    clearButtonStyle={{ verticalAlign: 'bottom' }}
                    onChangeDate={this.handleChangeDate}
                    minDate={filter.minDate}
                    maxDate={filter.maxDate}
                    autoOk
                  />
                </div>
              </section>
            )}
            {config.geography && (
              <section className={styles.Section}>
                <h3 className={styles.Section__Title}>Location</h3>
                <div className={styles.Section__Content}>
                  <CountrySelectField
                    onChangeCountry={this.handleChangeCountry}
                    countryId={this.props.filter.countryId}
                    floatingLabelText="Country"
                    style={{ verticalAlign: 'bottom' }}
                  />
                  <StateSelectField
                    onChangeState={this.handleChangeState}
                    countryId={this.props.filter.countryId}
                    stateId={this.props.filter.stateId}
                    floatingLabelText="State"
                    style={{ verticalAlign: 'bottom' }}
                  />
                  <LgaSelectField
                    onChangeLga={this.handleChangeLga}
                    countryId={this.props.filter.countryId}
                    stateId={this.props.filter.stateId}
                    lgaId={this.props.filter.lgaId}
                    floatingLabelText="Area"
                    style={{ verticalAlign: 'bottom' }}
                  />
                </div>
              </section>
            )}
            {hasDataSection && (
              <section className={styles.Section}>
                <h3 className={styles.Section__Title}>Data</h3>
                <div className={styles.Section__Content}>
                  {config.assayAndResultCategory && (
                    <AssaySelectField
                      value={filter.assayId}
                      onAssayChange={this.handleAssayIdChange}
                      floatingLabelText="Assay"
                      style={{ verticalAlign: 'bottom' }}
                    />
                  )}
                  {config.assayAndResultCategory && (
                    <ResultCategorySelectField
                      disabled={!filter.assayId}
                      assayId={filter.assayId}
                      value={filter.resultCategoryId}
                      onResultCategoryChange={this.handleResultCategoryChange}
                      floatingLabelText="Result"
                      style={{ verticalAlign: 'bottom' }}
                    />
                  )}
                  {config.consumable && (
                    <ConsumableSelectField
                      value={filter.consumableId}
                      onConsumableChange={this.handleConsumableIdChange}
                      floatingLabelText="Consumable"
                      style={{ verticalAlign: 'bottom' }}
                      autoWidth
                    />
                  )}
                  {config.deviceName && (
                    <FocusBlurTextField
                      name="deviceName"
                      value={filter.deviceName || ''}
                      onCommitValue={this.handleTextFieldCommitValue}
                      floatingLabelText="Device name"
                    />
                  )}
                  {config.siteName && (
                    <FocusBlurTextField
                      name="siteName"
                      value={filter.siteName || ''}
                      onCommitValue={this.handleTextFieldCommitValue}
                      floatingLabelText="Site name"
                    />
                  )}
                  {config.contactNameOrEmail && (
                    <FocusBlurTextField
                      name="contactNameOrEmail"
                      value={filter.contactNameOrEmail || ''}
                      onCommitValue={this.handleTextFieldCommitValue}
                      floatingLabelText="Contact name/email"
                    />
                  )}
                </div>
              </section>
            )}
          </CardText>
          <CardActions expandable>
            <FlatButton label="Share" />
            <FlatButton label="Save" />
            <FlatButton label="Clear" style={{ float: 'right' }} onTouchTap={this.props.onClearFilter} />
          </CardActions>
        </Card>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    config: state.filter.listConfig,
    filter: state.filter.listFilter.toJS()
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onClearFilter: clearListFilter,
    onChangeFilter: _.flowRight(changeListFilter, Immutable.fromJS)
  }, dispatch)
}

export const ListFilterContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ListFilter)

export default ListFilterContainer
