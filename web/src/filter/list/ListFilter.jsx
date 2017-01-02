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
import IconExport from 'material-ui/svg-icons/navigation/arrow-forward'
import Dialog from 'material-ui/Dialog'

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
  changeListFilter,

  exportFormatTypes,
  askExportConfirmation,
  closeExportConfirmation,
  beginListExportProcessing
} from '../FilterRedux'
import getFilterMessage from '../formatting'

import styles from './ListFilter.css'

const messages = defineMessages({
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
  exportExcel: {
    id: 'pages.ListExport.exportExcel',
    defaultMessage: 'Excel'
  },
  exportCsv: {
    id: 'pages.ListExport.exportCsv',
    defaultMessage: 'CSV'
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
    assay: PropTypes.object.isRequired,
    consumableItems: PropTypes.object.isRequired,
    filterTemplate: PropTypes.string.isRequired,
    filterTemplateOptional: PropTypes.string,

    // for store.filter.ListExport
    onClickExport: PropTypes.func,
    listExport: PropTypes.shape({
      askingConfirmation: PropTypes.bool.isRequired,
      processingExportExcel: PropTypes.bool.isRequired,
      processingExportCsv: PropTypes.bool.isRequired,
      currentFormatType: PropTypes.string
    }),
    showExportExcel: PropTypes.bool,
    showExportCsv: PropTypes.bool,
    askExportConfirmation: PropTypes.func,
    closeExportConfirmation: PropTypes.func,
    beginListExportProcessing: PropTypes.func,
    askConfirmationForExport: PropTypes.bool,
  }

  state = {
    expanded: !!this.props.defaultExpanded,
    askConfirmationForExport: this.props.askConfirmationForExport || false
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

  // ----------------------
  // functions for List Export
  // ----------------------
  clickExportExcel = () => { this.clickExport(exportFormatTypes.EXCEL) }
  clickExportCsv = () => { this.clickExport(exportFormatTypes.CSV) }
  clickExport = (formatType) => {
    if (this.state.askConfirmationForExport === true) {
      this.props.askExportConfirmation(formatType)
    } else {
      this.props.beginListExportProcessing(formatType)
      this.props.onClickExport(formatType)
    }
  }
  confirmationDisagreed = () => { this.props.closeExportConfirmation() }
  confirmationAgreed = () => {
    this.props.beginListExportProcessing(this.props.listExport.currentFormatType)
    this.props.onClickExport(this.props.listExport.currentFormatType)
    this.props.closeExportConfirmation()
  }

  render() {
    const { filter,
          countries,
          assay,
          consumableItems,
          config,
          subject,
          filterTemplate,
          filterTemplateOptional,
          dateFilterLabel,
          intl: { formatMessage, formatDate },

          onClickExport,
          showExportExcel,
          showExportCsv,
          listExport
        } = this.props
    const showExcel = !!onClickExport && (showExportExcel || true) === true
    const showCsv = !!onClickExport && (showExportCsv || true) === true
    const isPrimary = true
    const isModal = true

    const { expanded } = this.state

    const hasDataSection = (
      config.assay || config.deviceName || config.result ||
      config.siteName || config.contactNameOrEmail || config.consumable
    )

    const filterMessage = getFilterMessage(filter,
      countries,
      assay,
      consumableItems,
      subject,
      filterTemplate,
      filterTemplateOptional,
      formatMessage,
      formatDate)

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


            <FlatButton label={formatMessage(messages.exportExcel)} icon={<IconExport />} disabled={listExport.processingExportExcel} onTouchTap={this.clickExportExcel} style={{ display: showExcel ? '' : 'none', marginLeft: '30px' }} />
            <FlatButton label={formatMessage(messages.exportCsv)} icon={<IconExport />} disabled={listExport.processingExportCsv} onTouchTap={this.clickExportCsv} style={{ display: showCsv ? '' : 'none' }} />
            <Dialog
              title="Export Confirmation"
              actions={[
                <FlatButton primary={isPrimary} label="Yes, Export" onTouchTap={this.confirmationAgreed} />,
                <FlatButton primary={isPrimary} label="No, Cancel" onTouchTap={this.confirmationDisagreed} />
              ]}
              modal={isModal}
              open={listExport.askingConfirmation}
            >
              Do you want to export whole list to <strong>{(listExport.currentFormatType || '').toUpperCase()}</strong> file?
            </Dialog>

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
    listExport: state.filter.listExport,
    countries: state.geography.countriesForLocationSelector,
    assay: state.assay,
    consumableItems: state.consumable.items
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onClearFilter: clearListFilter,
    onChangeFilter: _.flowRight(changeListFilter, Immutable.fromJS),

    askExportConfirmation,
    closeExportConfirmation,
    beginListExportProcessing
  }, dispatch)
}

export const ListFilterContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ListFilter)

export default ListFilterContainer
