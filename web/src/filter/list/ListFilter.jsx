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
  },
  save: {
    id: 'shared.ListFilter.save',
    defaultMessage: 'Save'
  },
  share: {
    id: 'shared.ListFilter.share',
    defaultMessage: 'Share'
  },
  clear: {
    id: 'shared.ListFilter.clear',
    defaultMessage: 'Clear'
  },
  contactNameEmail: {
    id: 'shared.ListFilter.contactNameEmail',
    defaultMessage: 'Contact name/email'
  },
  setContactNameEmail: {
    id: 'shared.ListFilter.setContactNameEmail',
    defaultMessage: 'Enter contact name/email...'
  },
  site: {
    id: 'shared.ListFilter.site',
    defaultMessage: 'Site'
  },
  enterSiteName: {
    id: 'shared.ListFilter.enterSiteName',
    defaultMessage: 'Enter site name...'
  },
  date: {
    id: 'shared.ListFilter.date',
    defaultMessage: 'Date'
  },
  deviceName: {
    id: 'shared.ListFilter.deviceName',
    defaultMessage: 'Device'
  },
  enterDeviceName: {
    id: 'shared.ListFilter.enterDeviceName',
    defaultMessage: 'Enter device name...'
  },
  consumable: {
    id: 'shared.ListFilter.consumable',
    defaultMessage: 'Consumable'
  },
  selectConsumable: {
    id: 'shared.ListFilter.selectConsumable',
    defaultMessage: 'Select consumable...'
  },
  result: {
    id: 'shared.ListFilter.result',
    defaultMessage: 'Result'
  },
  selectResult: {
    id: 'shared.ListFilter.selectResult',
    defaultMessage: 'Select result...'
  },
  assay: {
    id: 'shared.ListFilter.assay',
    defaultMessage: 'Assay'
  },
  selectAssay: {
    id: 'shared.ListFilter.selectAssay',
    defaultMessage: 'Select assay...'
  },
  lga: {
    id: 'shared.ListFilter.lga',
    defaultMessage: 'Area'
  },
  selectLga: {
    id: 'shared.ListFilter.selectLga',
    defaultMessage: 'Select area...'
  },
  state: {
    id: 'shared.ListFilter.state',
    defaultMessage: 'State'
  },
  selectState: {
    id: 'shared.ListFilter.selectState',
    defaultMessage: 'Select state...'
  },
  country: {
    id: 'shared.ListFilter.country',
    defaultMessage: 'Country'
  },
  selectCountry: {
    id: 'shared.ListFilter.selectCountry',
    defaultMessage: 'Select country...'
  },
  setFilters: {
    id: 'shared.ListFilter.setFilters',
    defaultMessage: 'Set Filters'
  },
  geographyIn: {
    id: 'shared.ListFilter.geographyIn',
    defaultMessage: 'in'
  },
  whoseNameIncludes: {
    id: 'shared.ListFilter.whoseNameIncludes',
    defaultMessage: 'whose name includes'
  },
  assays: {
    id: 'shared.ListFilter.assays',
    defaultMessage: 'assays'
  },
  withResult: {
    id: 'shared.ListFilter.withResult',
    defaultMessage: 'with result'
  },
  dateFrom: {
    id: 'shared.ListFilter.dateFrom',
    defaultMessage: 'from'
  },
  dateTo: {
    id: 'shared.ListFilter.dateTo',
    defaultMessage: 'to'
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
    subject: PropTypes.string,
    dateFilterLabel: PropTypes.string,
    countries: PropTypes.object.isRequired,
    assay: PropTypes.object.isRequired
  }

  state = {
    expanded: !!this.props.defaultExpanded
  }

  getFilterMessage = (filter, subject, template, optionalTemplate, formatMessage, formatDate) => {
    // return empty message if no filters set
    if (_.every(filter, f => !f)) {
      return `${formatMessage(messages.noFilters)} ${subject ? subject.toLowerCase() : ''}`
    }

    // location-related strings
    let geography = ''
    const country = filter.countryId ? this.props.countries.get('items').find(c => c.id === filter.countryId) : null
    const state = country && filter.stateId ? country.getIn(['children', 'items']).find(s => s.id === filter.stateId) : null
    const lga = state && filter.lgaId ? state.getIn(['children', 'items']).find(s => s.id === filter.lgaId) : null

    if (country || state || lga) {
      geography = ` ${formatMessage(messages.geographyIn)}
                    ${lga ? `${lga.get('name')}, ` : ''}
                    ${state ? `${state.get('name')}, ` : ''}
                    ${country.get('name')}`
    }

    // name-filter
    const name = `${filter.contactNameOrEmail || ''}${filter.deviceName || ''}${filter.siteName || ''}`
    const nameString = name ? ` ${formatMessage(messages.whoseNameIncludes)} "${name}"` : ''

    // assay/result
    const assay = filter.assayId ? this.props.assay.get('items').find(a => a.get('id') === filter.assayId) : null
    const result = assay && filter.resultCategoryId ?
      assay.get('resultCategories').find(r => r.get('id') === String(filter.resultCategoryId)) : null
    const assayString = assay ? `${assay.get('name')} ${formatMessage(messages.assays)}` : ''
    const resultString = result ? ` ${formatMessage(messages.withResult)} "${result.get('name')}"` : ''

    // date
    const dateFrom = filter.minDate ? `${formatMessage(messages.dateFrom)} ${formatDate(filter.minDate)}` : ''
    const dateTo = filter.maxDate ? `${formatMessage(messages.dateTo)} ${formatDate(filter.maxDate)}` : ''

    // TODO: This could be a little nicer and use the date type from the filter.
    // Could say "the year 2015" or "the month of August"
    const dateString = `${dateFrom ? ` ${dateFrom}` : ''}${dateTo && dateFrom ? ` ${dateTo}` : dateTo}`

    // The optional template lets us specify a message that only shows up if
    // assay, result, or date is set. For example, if we want to show a message that explains
    // the number of results on a device
    let optionalMessage = ''
    if (optionalTemplate && (assayString || resultString || dateString)) {
      optionalMessage = optionalTemplate
                          .replace('<ASSAY>', assayString)
                          .replace('<RESULT>', resultString)
                          .replace('<DATE>', dateString)
    }

    const message = `${template
                          .replace('<GEOGRAPHY>', geography)
                          .replace('<NAME>', nameString)
                          .replace('<ASSAY>', assayString)
                          .replace('<RESULT>', resultString)
                          .replace('<DATE>', dateString)} ${optionalMessage}`

    return message

    // return `\`${JSON.stringify(filter)}\``

    /*
    countryId
    minDate
    maxDate
    */

    /*
    Devices: Viewing devices in AREA, STATE, COUNTRY whose name includes "NAME".
    Only counting ASSAY result with result "RESULT" <DATE></DATE>

    Routers: Viewing routers in AREA, STATE, COUNTRY whose name includes "NAME".
    Only counting ASSAY result with result "RESULT" DATE

    Sites: Viewing sites in AREA, STATE, COUNTRY whose name includes "NAME"
    (and which have a device named "NAME")

    Results: Viewing ASSAY results DATE with result "RESULT" in AREA, STATE, COUNTRY from sites
    whose name includes "NAME"

    Contacts: Viewing contacts in AREA, STATE, COUNTRY whose name or email inclues "NAME".

    Notification: Viewing notifications whose name inclues "NAME"

    Reports: Viewing reports whose name includes "NAME"
    */
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
    const { filter,
            config,
            subject,
            dateFilterLabel,
            intl: { formatMessage, formatDate } } = this.props
    const { expanded } = this.state

    const hasDataSection = (
      config.assay || config.deviceName || config.result ||
      config.siteName || config.contactNameOrEmail || config.consumable
    )

    const filterMessage = this.getFilterMessage(filter, subject, 'Viewing all devices<GEOGRAPHY><NAME>.', 'Counting only <ASSAY><RESULT><DATE>.', formatMessage, formatDate)

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
                <h3 className={styles.Section__Title}>{formatMessage(messages.setFilters)}</h3>
                <div className={styles.Section__Content}>
                  <div className={styles.Section__Control}>
                    <CountrySelectField
                      onChangeCountry={this.handleChangeCountry}
                      countryId={this.props.filter.countryId}
                      floatingLabelFixed
                      hintText={formatMessage(messages.selectCountry)}
                      floatingLabelText={formatMessage(messages.country)}
                      style={{ verticalAlign: 'bottom' }}
                    />
                  </div>
                  <div className={styles.Section__Control}>
                    <StateSelectField
                      onChangeState={this.handleChangeState}
                      countryId={this.props.filter.countryId}
                      stateId={this.props.filter.stateId}
                      floatingLabelFixed
                      hintText={formatMessage(messages.selectState)}
                      floatingLabelText={formatMessage(messages.state)}
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
                      hintText={formatMessage(messages.selectLga)}
                      floatingLabelText={formatMessage(messages.lga)}
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
                        hintText={formatMessage(messages.selectAssay)}
                        floatingLabelText={formatMessage(messages.assay)}
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
                        hintText={formatMessage(messages.selectResult)}
                        floatingLabelText={formatMessage(messages.result)}
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
                        hintText={formatMessage(messages.selectConsumable)}
                        floatingLabelText={formatMessage(messages.consumable)}
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
                        hintText={formatMessage(messages.enterDeviceName)}
                        floatingLabelText={formatMessage(messages.deviceName)}
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
                        hintText={formatMessage(messages.enterSiteName)}
                        floatingLabelText={formatMessage(messages.site)}
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
                        hintText={formatMessage(messages.setContactNameEmail)}
                        floatingLabelText={formatMessage(messages.contactNameEmail)}
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
                      floatingLabelText={dateFilterLabel || formatMessage(messages.date)}
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
            <FlatButton label={formatMessage(messages.clear)} secondary style={{ float: 'right' }} onTouchTap={this.props.onClearFilter} />
            <FlatButton label={formatMessage(messages.share)} icon={<Share />} />
            <FlatButton label={formatMessage(messages.save)} icon={<Bookmark />} />
          </CardActions>
        </Card>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    config: state.filter.listConfig,
    filter: state.filter.listFilter.toJS(),
    countries: state.geography.countriesForLocationSelector,
    assay: state.assay
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
