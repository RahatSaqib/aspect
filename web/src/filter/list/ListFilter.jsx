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
import IconButton from 'material-ui/IconButton'
import FlatButton from 'material-ui/FlatButton'
import Dialog from 'material-ui/Dialog'
import Share from 'material-ui/svg-icons/social/share'
import Bookmark from 'material-ui/svg-icons/action/bookmark-border'
import IconExport from 'material-ui/svg-icons/navigation/arrow-forward'
import Close from 'material-ui/svg-icons/navigation/close'

// Our own imports
import FocusBlurTextField from '../../components/shared/FocusBlurTextField'
import CountrySelectField from '../geography/CountrySelectField'
import StateSelectField from '../geography/StateSelectField'
import LgaSelectField from '../geography/LgaSelectField'
import AssaySelectField from '../resource/AssaySelectField'
import ResultCategorySelectField from '../resource/ResultCategorySelectField'
import ConsumableSelectField from '../resource/ConsumableSelectField'
import DateRangeSelector from '../date/DateRangeSelector'
import ResultWorkflowStatusSelectField from '../resource/ResultWorkflowStatusSelectField'
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
  clearTooltip: {
    id: 'shared.ListFilter.clear',
    defaultMessage: 'Clear Filters'
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

  exportExcel: {
    id: 'pages.ListExport.exportExcel',
    defaultMessage: 'Excel'
  },
  exportCsv: {
    id: 'pages.ListExport.exportCsv',
    defaultMessage: 'CSV'
  },
  workflowStatus: {
    id: 'shared.ListFilter.workflowStatus',
    defaultMessage: 'Workflow Status'
  },
  selectWorkflowStatus: {
    id: 'shared.ListFilter.selectWorkflowStatus',
    defaultMessage: 'Select status...'
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
      consumableId: PropTypes.string,
      workflowStatusId: PropTypes.string
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
      consumable: PropTypes.bool,
      workflowStatus: PropTypes.bool
    }).isRequired,
    subject: PropTypes.string,
    dateFilterLabel: PropTypes.string,

    countries: PropTypes.object.isRequired,
    assay: PropTypes.object.isRequired,
    consumable: PropTypes.object.isRequired,
    workflowStatusItems: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string
    }),
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

  static contextTypes = {
    muiTheme: PropTypes.object.isRequired
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

  handleClearFilter = (event) => {
    event.stopPropagation() // prevent triggering expanded inside <CardHeader />
    this.props.onClearFilter()
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

  handleWorkflowStatusIdChange = (workflowStatusId) => {
    const nextFilter = {
      ...this.props.filter,
      workflowStatusId
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
          consumable,
          config,
          subject,
          filterTemplate,
          filterTemplateOptional,
          dateFilterLabel,
          intl: { formatMessage, formatDate },
          workflowStatusItems,

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

    const hasDataSection2 = (
      config.date || config.workflowStatus
    )

    const nonEmptyFilter = !_.isEmpty(_.filter(filter, x => !_.isNull(x) && !_.isUndefined(x)))

    const filterMessage = getFilterMessage(filter,
      countries,
      assay,
      consumable,
      subject,
      filterTemplate,
      filterTemplateOptional,
      formatMessage,
      formatDate,
      workflowStatusItems)

    return (
      <div className={styles.ListFilter}>
        <Card expanded={expanded} onExpandChange={this.handleExpandChange}>
          <CardHeader
            subtitle={
              <span style={{ verticalAlign: 'middle' }}>
                {filterMessage}
                {!expanded && nonEmptyFilter && (
                  <IconButton
                    tooltip={formatMessage(messages.clearTooltip)}
                    onTouchTap={this.handleClearFilter}
                    style={{ padding: 0, height: 18, width: 18, verticalAlign: 'middle' }}
                    iconStyle={{ height: 18, width: 18 }}
                  >
                    <Close color={this.context.muiTheme.flatButton.secondaryTextColor} />
                  </IconButton>
                )}
              </span>
            }
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
            {hasDataSection2 && (
              <section className={styles.Section}>
                <div className={styles.Section__Content}>
                  {config.date && (
                    <div className={styles.Section__Control}>
                      <DateRangeSelector
                        floatingLabelText={dateFilterLabel || formatMessage(messages.date)}
                        onChangeDate={this.handleChangeDate}
                        minDate={filter.minDate}
                        maxDate={filter.maxDate}
                        autoOk
                      />
                    </div>
                  )}
                  {config.workflowStatus && (
                    <div className={styles.Section__Control}>
                      <ResultWorkflowStatusSelectField
                        value={filter.workflowStatusId}
                        onWorkflowStatusChange={this.handleWorkflowStatusIdChange}
                        floatingLabelFixed
                        hintText={formatMessage(messages.selectWorkflowStatus)}
                        floatingLabelText={formatMessage(messages.workflowStatus)}
                        style={{ verticalAlign: 'bottom' }}
                        autoWidth
                      />
                    </div>
                  )}
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
            <a id="anchorExportProxy" />
            <Dialog
              title="Export Confirmation"
              actions={[
                <FlatButton primary={isPrimary} label="Yes, Export" onTouchTap={this.confirmationAgreed} />,
                <FlatButton primary={isPrimary} label="No, Cancel" onTouchTap={this.confirmationDisagreed} />
              ]}
              modal={isModal}
              open={listExport.askingConfirmation}
            >
              You are exporting a large number of items to <strong>{(listExport.currentFormatType || '').toUpperCase()}</strong> file.
              This may take a while. Continue?
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
    consumable: state.consumable.consumables,
    workflowStatusItems: state.resultWorkflowStatus.items
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
