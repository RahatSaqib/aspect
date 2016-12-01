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
import Share from 'material-ui/svg-icons/social/share'
import Bookmark from 'material-ui/svg-icons/action/bookmark-border'

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
            {config.geography && (
              <section className={styles.Section}>
                <h3 className={styles.Section__Title}>Set Filters</h3>
                <div className={styles.Section__Content}>
                  <div className={styles.Section__Control}>
                    <CountrySelectField
                      onChangeCountry={this.handleChangeCountry}
                      countryId={this.props.filter.countryId}
                      floatingLabelFixed
                      hintText="Select Country..."
                      floatingLabelText="Country"
                      style={{ verticalAlign: 'bottom' }}
                    />
                  </div>
                  <div className={styles.Section__Control}>
                    <StateSelectField
                      onChangeState={this.handleChangeState}
                      countryId={this.props.filter.countryId}
                      stateId={this.props.filter.stateId}
                      floatingLabelFixed
                      hintText="Select State..."
                      floatingLabelText="State"
                      style={{ verticalAlign: 'bottom' }}
                    />
                  </div>
                  <div className={styles.Section__Control}>
                    <LgaSelectField
                      onChangeLga={this.handleChangeLga}
                      countryId={this.props.filter.countryId}
                      stateId={this.props.filter.stateId}
                      lgaId={this.props.filter.lgaId}
                      floatingLabelFixed
                      hintText="Select Area..."
                      floatingLabelText="Area"
                      style={{ verticalAlign: 'bottom' }}
                    />
                  </div>
                </div>
              </section>
            )}
            {hasDataSection && (
              <section className={styles.Section}>
                <div className={styles.Section__Content}>
                  {config.assayAndResultCategory && (
                    <div className={styles.Section__Control}>
                      <AssaySelectField
                        value={filter.assayId}
                        onAssayChange={this.handleAssayIdChange}
                        floatingLabelFixed
                        hintText="Select Assay..."
                        floatingLabelText="Assay"
                        style={{ verticalAlign: 'bottom' }}
                      />
                    </div>
                  )}
                  {config.assayAndResultCategory && (
                    <div className={styles.Section__Control}>
                      <ResultCategorySelectField
                        disabled={!filter.assayId}
                        assayId={filter.assayId}
                        value={filter.resultCategoryId}
                        onResultCategoryChange={this.handleResultCategoryChange}
                        floatingLabelFixed
                        hintText="Select Result..."
                        floatingLabelText="Result"
                        style={{ verticalAlign: 'bottom' }}
                      />
                    </div>
                  )}
                  {config.consumable && (
                    <div className={styles.Section__Control}>
                      <ConsumableSelectField
                        value={filter.consumableId}
                        onConsumableChange={this.handleConsumableIdChange}
                        floatingLabelFixed
                        hintText="Select Consumable..."
                        floatingLabelText="Consumable"
                        style={{ verticalAlign: 'bottom' }}
                        autoWidth
                      />
                    </div>
                  )}
                  {config.deviceName && (
                    <div className={styles.Section__Control}>
                      <FocusBlurTextField
                        name="deviceName"
                        value={filter.deviceName || ''}
                        onCommitValue={this.handleTextFieldCommitValue}
                        floatingLabelFixed
                        hintText="Enter device name..."
                        floatingLabelText="Device name"
                      />
                    </div>
                  )}
                  {config.siteName && (
                    <div className={styles.Section__Control}>
                      <FocusBlurTextField
                        name="siteName"
                        value={filter.siteName || ''}
                        onCommitValue={this.handleTextFieldCommitValue}
                        floatingLabelFixed
                        hintText="Enter site name..."
                        floatingLabelText="Site name"
                      />
                    </div>
                  )}
                  {config.contactNameOrEmail && (
                    <div className={styles.Section__Control}>
                      <FocusBlurTextField
                        name="contactNameOrEmail"
                        value={filter.contactNameOrEmail || ''}
                        onCommitValue={this.handleTextFieldCommitValue}
                        floatingLabelFixed
                        hintText="Enter contact name/email..."
                        floatingLabelText="Contact name/email"
                      />
                    </div>
                  )}
                </div>
              </section>
            )}
            {config.date && (
              <section className={styles.Section}>
                <div className={styles.Section__Content}>
                  <div className={styles.Section__Control}>
                    <DateRangeSelector
                      clearButtonTooltip="Clear"
                      clearButtonStyle={{ verticalAlign: 'bottom' }}
                      onChangeDate={this.handleChangeDate}
                      minDate={filter.minDate}
                      maxDate={filter.maxDate}
                      autoOk
                    />
                  </div>
                </div>
              </section>
            )}
          </CardText>
          <CardActions expandable>
            <FlatButton label="OK" primary style={{ float: 'right' }} onTouchTap={() => this.handleExpandChange(false)} />
            <FlatButton label="Clear" secondary style={{ float: 'right' }} onTouchTap={this.props.onClearFilter} />
            <FlatButton label="Share" icon={<Share />} />
            <FlatButton label="Save" icon={<Bookmark />} />
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
