// Imports from packages
import _ from 'lodash'
import Immutable from 'immutable'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { injectIntl, defineMessages, intlShape } from 'react-intl'

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
import PartnerSelectField from '../partner/PartnerSelectField'
import AssaySelectField from '../resource/AssaySelectField'
import ResultCategorySelectField from '../resource/ResultCategorySelectField'
import ConsumableSelectField from '../resource/ConsumableSelectField'
import SiteAutoCompleteField from '../resource/SiteAutoCompleteField'
import DateRangeSelector from '../date/DateRangeSelector'
import ResultWorkflowStatusSelectField from '../resource/ResultWorkflowStatusSelectField'
import DeviceStatusSelectField from '../resource/DeviceStatusSelectField'
import FilterMessage from './FilterMessage'
import {
  clearListFilter,
  changeListFilter,
  exportFormatTypes,
  askExportConfirmation,
  closeExportConfirmation,
  beginListExportProcessing,
} from '../FilterRedux'
import { nonEmptyFilterValue } from '../utils'

import styles from './ListFilter.css'

const messages = defineMessages({
  clearTooltip: {
    id: 'shared.ListFilter.clearTooltip',
    defaultMessage: 'Clear Filters',
  },
  save: {
    id: 'shared.ListFilter.save',
    defaultMessage: 'Save',
  },
  share: {
    id: 'shared.ListFilter.share',
    defaultMessage: 'Share',
  },
  clear: {
    id: 'shared.ListFilter.clear',
    defaultMessage: 'Clear',
  },
  all: {
    id: 'shared.ListFilter.all',
    defaultMessage: 'All',
  },
  none: {
    id: 'shared.ListFilter.none',
    defaultMessage: 'None',
  },
  contactNameEmail: {
    id: 'shared.ListFilter.contactNameEmail',
    defaultMessage: 'Contact name/email',
  },
  setContactNameEmail: {
    id: 'shared.ListFilter.setContactNameEmail',
    defaultMessage: 'Enter contact name/email...',
  },
  site: {
    id: 'shared.ListFilter.site',
    defaultMessage: 'Site',
  },
  enterSiteName: {
    id: 'shared.ListFilter.enterSiteName',
    defaultMessage: 'Enter site name...',
  },
  sampleOriginSite: {
    id: 'shared.ListFilter.sampleOriginSite',
    defaultMessage: 'Sample origin site',
  },
  enterSampleOriginSite: {
    id: 'shared.ListFilter.enterSampleOriginSite',
    defaultMessage: 'Enter sample origin site name...',
  },
  date: {
    id: 'shared.ListFilter.date',
    defaultMessage: 'Date',
  },
  deviceName: {
    id: 'shared.ListFilter.deviceName',
    defaultMessage: 'Device',
  },
  enterDeviceName: {
    id: 'shared.ListFilter.enterDeviceName',
    defaultMessage: 'Enter device name...',
  },
  consumable: {
    id: 'shared.ListFilter.consumable',
    defaultMessage: 'Consumable',
  },
  selectConsumable: {
    id: 'shared.ListFilter.selectConsumable',
    defaultMessage: 'Select consumable...',
  },
  partner: {
    id: 'shared.ListFilter.partner',
    defaultMessage: 'Partner',
  },
  selectPartner: {
    id: 'shared.ListFilter.selectPartner',
    defaultMessage: 'Select partner...',
  },
  patientOrResearchId: {
    id: 'shared.ListFilter.patientOrResearchId',
    defaultMessage: 'Patient/Study ID',
  },
  enterPatientOrResearchId: {
    id: 'shared.ListFilter.enterPatientOrResearchId',
    defaultMessage: 'Enter patient/study ID...',
  },
  sampleId: {
    id: 'shared.ListFilter.sampleId',
    defaultMessage: 'Sample ID',
  },
  enterSampleId: {
    id: 'shared.ListFilter.enterSampleId',
    defaultMessage: 'Enter sample ID...',
  },
  sampleGroup: {
    id: 'shared.ListFilter.sampleGroup',
    defaultMessage: 'Sample Group',
  },
  enterSampleGroup: {
    id: 'shared.ListFilter.enterSampleGroup',
    defaultMessage: 'Enter sample group...',
  },
  result: {
    id: 'shared.ListFilter.result',
    defaultMessage: 'Result',
  },
  selectResult: {
    id: 'shared.ListFilter.selectResult',
    defaultMessage: 'Select result...',
  },
  assay: {
    id: 'shared.ListFilter.assay',
    defaultMessage: 'Assay',
  },
  selectAssay: {
    id: 'shared.ListFilter.selectAssay',
    defaultMessage: 'Select assay...',
  },
  lga: {
    id: 'shared.ListFilter.lga',
    defaultMessage: 'Area',
  },
  selectLga: {
    id: 'shared.ListFilter.selectLga',
    defaultMessage: 'Select area...',
  },
  state: {
    id: 'shared.ListFilter.state',
    defaultMessage: 'State',
  },
  selectState: {
    id: 'shared.ListFilter.selectState',
    defaultMessage: 'Select state...',
  },
  country: {
    id: 'shared.ListFilter.country',
    defaultMessage: 'Country',
  },
  selectCountry: {
    id: 'shared.ListFilter.selectCountry',
    defaultMessage: 'Select country...',
  },
  setFilters: {
    id: 'shared.ListFilter.setFilters',
    defaultMessage: 'Set Filters',
  },

  exportExcel: {
    id: 'pages.ListExport.exportExcel',
    defaultMessage: 'Excel',
  },
  exportCsv: {
    id: 'pages.ListExport.exportCsv',
    defaultMessage: 'CSV',
  },
  workflowStatus: {
    id: 'shared.ListFilter.workflowStatus',
    defaultMessage: 'Workflow Status',
  },
  selectWorkflowStatus: {
    id: 'shared.ListFilter.selectWorkflowStatus',
    defaultMessage: 'Select status...',
  },
  deviceStatus: {
    id: 'shared.ListFilter.deviceStatus',
    defaultMessage: 'Device Status',
  },
  selectDeviceStatus: {
    id: 'shared.ListFilter.selectDeviceStatus',
    defaultMessage: 'Select status...',
  },
  externalId: {
    id: 'shared.ListFilter.externalId',
    defaultMessage: 'Facility Code',
  },
  enterExternalId: {
    id: 'shared.ListFilter.enterExternalId',
    defaultMessage: 'Enter facility code...',
  },
})

export class ListFilter extends PureComponent {
  static propTypes = {
    onClearFilter: PropTypes.func.isRequired, // connect
    onChangeFilter: PropTypes.func.isRequired, // connect
    listFilter: PropTypes.shape({
      toJS: PropTypes.func,
      assayId: PropTypes.string,
      countryId: PropTypes.string,
      stateId: PropTypes.string,
      lgaId: PropTypes.string,
      minDate: PropTypes.string,
      maxDate: PropTypes.string,
      deviceName: PropTypes.string,
      partnerId: PropTypes.string,
      resultCategoryId: PropTypes.string,
      siteName: PropTypes.string,
      contactNameOrEmail: PropTypes.string,
      consumableId: PropTypes.string,
      workflowStatusId: PropTypes.string,
      deviceStatusId: PropTypes.string,
      externalId: PropTypes.string,
    }).isRequired, // connect
    intl: intlShape.isRequired,
    defaultExpanded: PropTypes.bool,
    config: PropTypes.shape({
      assayAndResultCategory: PropTypes.bool,
      geography: PropTypes.bool, // country, state, lga
      state: PropTypes.bool,
      lga: PropTypes.bool,
      date: PropTypes.bool,
      partnerId: PropTypes.bool,
      deviceName: PropTypes.bool,
      siteName: PropTypes.bool,
      contactNameOrEmail: PropTypes.bool,
      consumable: PropTypes.bool,
      workflowStatus: PropTypes.bool,
      deviceStatus: PropTypes.bool,
      externalId: PropTypes.bool,
    }).isRequired,
    subject: PropTypes.string,
    dateFilterLabel: PropTypes.string,

    filterTemplate: PropTypes.string.isRequired,
    filterTemplateOptional: PropTypes.string,

    // for store.filter.ListExport
    onClickExport: PropTypes.func,
    listExport: PropTypes.shape({
      askingConfirmation: PropTypes.bool.isRequired,
      processingExportExcel: PropTypes.bool.isRequired,
      processingExportCsv: PropTypes.bool.isRequired,
      currentFormatType: PropTypes.string,
    }),
    showExportExcel: PropTypes.bool,
    showExportCsv: PropTypes.bool,
    askExportConfirmation: PropTypes.func,
    closeExportConfirmation: PropTypes.func,
    beginListExportProcessing: PropTypes.func,
    askConfirmationForExport: PropTypes.bool,
  }

  static defaultProps = {
    defaultExpanded: false,
    subject: '',
    dateFilterLabel: '',
    filterTemplateOptional: '',
    onClickExport: undefined,
    listExport: {
      askingConfirmation: false,
      processingExportExcel: false,
      processingExportCsv: false,
      currentFormatType: 'csv',
    },
    showExportExcel: false,
    showExportCsv: false,
    askExportConfirmation: false,
    closeExportConfirmation: false,
    beginListExportProcessing: undefined,
    askConfirmationForExport: false,
  }

  static contextTypes = {
    muiTheme: PropTypes.object.isRequired,
  }

  state = {
    expanded: !!this.props.defaultExpanded,
    askConfirmationForExport: this.props.askConfirmationForExport || false,
  }

  handleExpandChange = expanded => {
    this.setState({ expanded })
  }

  handleToggle = (event, toggle) => {
    this.setState({ expanded: toggle })
  }

  handleClearFilter = event => {
    event.stopPropagation() // prevent triggering expanded inside <CardHeader />
    this.props.onClearFilter()
  }

  handleAssayIdChange = assayId => {
    const nextFilter = {
      ...this.props.listFilter.toJS(),
      assayId,
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleChangeDate = dateValues => {
    const nextFilter = {
      ...this.props.listFilter.toJS(),
      ...dateValues,
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleChangeCountry = countryId => {
    const nextFilter = {
      ...this.props.listFilter.toJS(),
      countryId,
      stateId: undefined,
      lgaId: undefined,
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleChangeState = stateId => {
    const nextFilter = {
      ...this.props.listFilter.toJS(),
      stateId,
      lgaId: undefined,
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleChangeLga = lgaId => {
    const nextFilter = {
      ...this.props.listFilter.toJS(),
      lgaId,
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleResultCategoryChange = resultCategoryId => {
    const nextFilter = {
      ...this.props.listFilter.toJS(),
      resultCategoryId,
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleTextFieldCommitValue = event => {
    const nextFilter = {
      ...this.props.listFilter.toJS(),
      [event.target.name]: event.target.value,
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleConsumableIdChange = consumableId => {
    const nextFilter = {
      ...this.props.listFilter.toJS(),
      consumableId,
    }
    this.props.onChangeFilter(nextFilter)
  }

  handlePartnerIdChange = partnerId => {
    const nextFilter = {
      ...this.props.listFilter.toJS(),
      partnerId,
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleSampleOriginSiteChange = sampleOriginSite => {
    const nextFilter = {
      ...this.props.listFilter.toJS(),
      sampleOriginSite,
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleSiteChange = siteName => {
    const nextFilter = {
      ...this.props.listFilter.toJS(),
      siteName,
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleWorkflowStatusIdChange = workflowStatusId => {
    const nextFilter = {
      ...this.props.listFilter.toJS(),
      workflowStatusId,
    }
    this.props.onChangeFilter(nextFilter)
  }

  handleDeviceStatusIdChange = deviceStatusId => {
    const nextFilter = {
      ...this.props.listFilter.toJS(),
      deviceStatusId,
    }
    this.props.onChangeFilter(nextFilter)
  }

  // ----------------------
  // functions for List Export
  // ----------------------
  clickExportExcel = () => {
    this.clickExport(exportFormatTypes.EXCEL)
  }
  clickExportCsv = () => {
    this.clickExport(exportFormatTypes.CSV)
  }
  clickExport = formatType => {
    if (this.state.askConfirmationForExport === true) {
      this.props.askExportConfirmation(formatType)
    } else {
      this.props.beginListExportProcessing(formatType)
      this.props.onClickExport(formatType)
    }
  }
  confirmationDisagreed = () => {
    this.props.closeExportConfirmation()
  }
  confirmationAgreed = () => {
    this.props.beginListExportProcessing(
      this.props.listExport.currentFormatType
    )
    this.props.onClickExport(this.props.listExport.currentFormatType)
    this.props.closeExportConfirmation()
  }

  render() {
    const {
      listFilter,
      config,
      subject,
      filterTemplate,
      filterTemplateOptional,
      dateFilterLabel,
      intl: { formatMessage },
      onClickExport,
      showExportExcel,
      showExportCsv,
      listExport,
    } = this.props
    const filter = listFilter.toJS()
    const showExcel = !!onClickExport && (showExportExcel || true) === true
    const showCsv = !!onClickExport && (showExportCsv || true) === true
    const isPrimary = true
    const isModal = true
    const { expanded } = this.state

    const hasDataSection =
      config.assay ||
      config.deviceName ||
      config.result ||
      config.siteName ||
      config.contactNameOrEmail ||
      config.consumable ||
      config.partnerId ||
      config.patientOrResearchId ||
      config.sampleId ||
      config.sampleGroup ||
      config.sampleOriginSite ||
      config.externalId

    const hasDataSection2 =
      config.date || config.workflowStatus || config.deviceStatus

    const nonEmptyFilter = !_.isEmpty(_.filter(filter, nonEmptyFilterValue))

    return (
      <div className={styles.ListFilter}>
        <Card expanded={expanded} onExpandChange={this.handleExpandChange}>
          <CardHeader
            subtitle={
              <span style={{ verticalAlign: 'middle' }}>
                <FilterMessage
                  subject={subject}
                  filterTemplate={filterTemplate}
                  filterTemplateOptional={filterTemplateOptional}
                />
                {!expanded &&
                  nonEmptyFilter &&
                  <IconButton
                    tooltip={formatMessage(messages.clearTooltip)}
                    onTouchTap={this.handleClearFilter}
                    style={{
                      padding: 0,
                      height: 18,
                      width: 18,
                      verticalAlign: 'middle',
                    }}
                    iconStyle={{ height: 18, width: 18 }}
                  >
                    <Close
                      color={
                        this.context.muiTheme.flatButton.secondaryTextColor
                      }
                    />
                  </IconButton>}
              </span>
            }
            actAsExpander
            showExpandableButton
          />
          <CardText expandable>
            {config.geography &&
              <section className={styles.Section}>
                <h3 className={styles.Section__Title}>
                  {formatMessage(messages.setFilters)}
                </h3>
                <div className={styles.Section__Content}>
                  <div className={styles.Section__Control}>
                    <CountrySelectField
                      allItemText={formatMessage(messages.all)}
                      onChangeCountry={this.handleChangeCountry}
                      countryId={this.props.listFilter.countryId}
                      floatingLabelFixed
                      hintText={formatMessage(messages.selectCountry)}
                      floatingLabelText={formatMessage(messages.country)}
                      style={{ verticalAlign: 'bottom' }}
                    />
                  </div>
                  {config.state &&
                    <div className={styles.Section__Control}>
                      <StateSelectField
                        allItemText={formatMessage(messages.all)}
                        onChangeState={this.handleChangeState}
                        countryId={this.props.listFilter.countryId}
                        stateId={this.props.listFilter.stateId}
                        floatingLabelFixed
                        hintText={formatMessage(messages.selectState)}
                        floatingLabelText={formatMessage(messages.state)}
                        style={{ verticalAlign: 'bottom' }}
                      />
                    </div>}
                  {config.state &&
                    config.lga &&
                    <div className={styles.Section__Control}>
                      <LgaSelectField
                        allItemText={formatMessage(messages.all)}
                        onChangeLga={this.handleChangeLga}
                        countryId={this.props.listFilter.countryId}
                        stateId={this.props.listFilter.stateId}
                        lgaId={this.props.listFilter.lgaId}
                        floatingLabelFixed
                        hintText={formatMessage(messages.selectLga)}
                        floatingLabelText={formatMessage(messages.lga)}
                        style={{ verticalAlign: 'bottom' }}
                      />
                    </div>}
                </div>
              </section>}
            {hasDataSection &&
              <section className={styles.Section}>
                <div className={styles.Section__Content}>
                  {config.assayAndResultCategory &&
                    <div className={styles.Section__Control}>
                      <AssaySelectField
                        allItemText={formatMessage(messages.all)}
                        value={filter.assayId}
                        onAssayChange={this.handleAssayIdChange}
                        floatingLabelFixed
                        hintText={formatMessage(messages.selectAssay)}
                        floatingLabelText={formatMessage(messages.assay)}
                        style={{ verticalAlign: 'bottom' }}
                      />
                    </div>}
                  {config.assayAndResultCategory &&
                    <div className={styles.Section__Control}>
                      <ResultCategorySelectField
                        allItemText={formatMessage(messages.all)}
                        disabled={!filter.assayId}
                        assayId={filter.assayId}
                        value={filter.resultCategoryId}
                        onResultCategoryChange={this.handleResultCategoryChange}
                        floatingLabelFixed
                        hintText={formatMessage(messages.selectResult)}
                        floatingLabelText={formatMessage(messages.result)}
                        style={{ verticalAlign: 'bottom' }}
                      />
                    </div>}
                  {config.consumable &&
                    <div className={styles.Section__Control}>
                      <ConsumableSelectField
                        allItemText={formatMessage(messages.all)}
                        value={filter.consumableId}
                        onConsumableChange={this.handleConsumableIdChange}
                        floatingLabelFixed
                        hintText={formatMessage(messages.selectConsumable)}
                        floatingLabelText={formatMessage(messages.consumable)}
                        style={{ verticalAlign: 'bottom' }}
                        autoWidth
                      />
                    </div>}
                  {config.partnerId &&
                    <div className={styles.Section__Control}>
                      <PartnerSelectField
                        emptyId="-1"
                        emptyText={formatMessage(messages.none)}
                        partnerId={filter.partnerId}
                        onChangePartner={this.handlePartnerIdChange}
                        floatingLabelFixed
                        hintText={formatMessage(messages.selectPartner)}
                        floatingLabelText={formatMessage(messages.partner)}
                        style={{ verticalAlign: 'bottom' }}
                        autoWidth
                      />
                    </div>}
                  {config.patientOrResearchId &&
                    <div className={styles.Section__Control}>
                      <FocusBlurTextField
                        name="patientOrResearchId"
                        value={filter.patientOrResearchId || ''}
                        onCommitValue={this.handleTextFieldCommitValue}
                        floatingLabelFixed
                        hintText={formatMessage(
                          messages.enterPatientOrResearchId
                        )}
                        floatingLabelText={formatMessage(
                          messages.patientOrResearchId
                        )}
                      />
                    </div>}
                  {config.sampleId &&
                    <div className={styles.Section__Control}>
                      <FocusBlurTextField
                        name="sampleId"
                        value={filter.sampleId || ''}
                        onCommitValue={this.handleTextFieldCommitValue}
                        floatingLabelFixed
                        hintText={formatMessage(messages.enterSampleId)}
                        floatingLabelText={formatMessage(messages.sampleId)}
                      />
                    </div>}
                  {config.sampleGroup &&
                    <div className={styles.Section__Control}>
                      <FocusBlurTextField
                        name="sampleGroup"
                        value={filter.sampleGroup || ''}
                        onCommitValue={this.handleTextFieldCommitValue}
                        floatingLabelFixed
                        hintText={formatMessage(messages.enterSampleGroup)}
                        floatingLabelText={formatMessage(messages.sampleGroup)}
                      />
                    </div>}
                  {config.deviceName &&
                    <div className={styles.Section__Control}>
                      <FocusBlurTextField
                        name="deviceName"
                        value={filter.deviceName || ''}
                        onCommitValue={this.handleTextFieldCommitValue}
                        floatingLabelFixed
                        hintText={formatMessage(messages.enterDeviceName)}
                        floatingLabelText={formatMessage(messages.deviceName)}
                      />
                    </div>}
                  {config.siteName &&
                    <div className={styles.Section__Control}>
                      <SiteAutoCompleteField
                        name="siteName"
                        value={filter.siteName || ''}
                        onChangeSite={this.handleSiteChange}
                        floatingLabelFixed
                        itemTextGetter={site =>
                          `${site.get('name')} (${site.get('state')})`}
                        hintText={formatMessage(messages.enterSiteName)}
                        floatingLabelText={formatMessage(messages.site)}
                      />
                    </div>}
                  {config.sampleOriginSite &&
                    <div className={styles.Section__Control}>
                      <SiteAutoCompleteField
                        name="sampleOriginSite"
                        value={filter.sampleOriginSite || ''}
                        onChangeSite={this.handleSampleOriginSiteChange}
                        floatingLabelFixed
                        itemTextGetter={site =>
                          `${site.get('name')} (${site.get('state')})`}
                        hintText={formatMessage(messages.enterSampleOriginSite)}
                        floatingLabelText={formatMessage(
                          messages.sampleOriginSite
                        )}
                      />
                    </div>}
                  {config.contactNameOrEmail &&
                    <div className={styles.Section__Control}>
                      <FocusBlurTextField
                        name="contactNameOrEmail"
                        value={filter.contactNameOrEmail || ''}
                        onCommitValue={this.handleTextFieldCommitValue}
                        floatingLabelFixed
                        hintText={formatMessage(messages.setContactNameEmail)}
                        floatingLabelText={formatMessage(
                          messages.contactNameEmail
                        )}
                      />
                    </div>}
                  {config.externalId &&
                    <div className={styles.Section__Control}>
                      <FocusBlurTextField
                        name="externalId"
                        value={filter.externalId || ''}
                        onCommitValue={this.handleTextFieldCommitValue}
                        floatingLabelFixed
                        hintText={formatMessage(messages.enterExternalId)}
                        floatingLabelText={formatMessage(messages.externalId)}
                      />
                    </div>}
                </div>
              </section>}
            {hasDataSection2 &&
              <section className={styles.Section}>
                <div className={styles.Section__Content}>
                  {config.date &&
                    <div className={styles.Section__Control}>
                      <DateRangeSelector
                        floatingLabelText={
                          dateFilterLabel || formatMessage(messages.date)
                        }
                        onChangeDate={this.handleChangeDate}
                        minDate={filter.minDate}
                        maxDate={filter.maxDate}
                        autoOk
                      />
                    </div>}
                  {config.workflowStatus &&
                    <div className={styles.Section__Control}>
                      <ResultWorkflowStatusSelectField
                        allItemText={formatMessage(messages.all)}
                        value={filter.workflowStatusId}
                        onWorkflowStatusChange={
                          this.handleWorkflowStatusIdChange
                        }
                        floatingLabelFixed
                        hintText={formatMessage(messages.selectWorkflowStatus)}
                        floatingLabelText={formatMessage(
                          messages.workflowStatus
                        )}
                        style={{ verticalAlign: 'bottom' }}
                        autoWidth
                      />
                    </div>}
                  {config.deviceStatus &&
                    <div className={styles.Section__Control}>
                      <DeviceStatusSelectField
                        allItemText={formatMessage(messages.all)}
                        value={filter.deviceStatusId}
                        onDeviceStatusChange={this.handleDeviceStatusIdChange}
                        floatingLabelFixed
                        hintText={formatMessage(messages.selectDeviceStatus)}
                        floatingLabelText={formatMessage(messages.deviceStatus)}
                        style={{ verticalAlign: 'bottom' }}
                        autoWidth
                      />
                    </div>}
                </div>
              </section>}
          </CardText>
          <CardActions expandable>
            <FlatButton
              label="OK"
              primary
              style={{ float: 'right' }}
              onTouchTap={() => this.handleExpandChange(false)}
            />
            <FlatButton
              label={formatMessage(messages.clear)}
              secondary
              style={{ float: 'right' }}
              onTouchTap={this.props.onClearFilter}
            />
            <FlatButton
              label={formatMessage(messages.share)}
              icon={<Share />}
            />
            <FlatButton
              label={formatMessage(messages.save)}
              icon={<Bookmark />}
            />

            <FlatButton
              label={formatMessage(messages.exportExcel)}
              icon={<IconExport />}
              disabled={listExport.processingExportExcel}
              onTouchTap={this.clickExportExcel}
              style={{ display: showExcel ? '' : 'none', marginLeft: '30px' }}
            />
            <FlatButton
              label={formatMessage(messages.exportCsv)}
              icon={<IconExport />}
              disabled={listExport.processingExportCsv}
              onTouchTap={this.clickExportCsv}
              style={{ display: showCsv ? '' : 'none' }}
            />
            <a id="anchorExportProxy" />
            <Dialog
              title="Export Confirmation"
              actions={[
                <FlatButton
                  primary={isPrimary}
                  label="Yes, Export"
                  onTouchTap={this.confirmationAgreed}
                />,
                <FlatButton
                  primary={isPrimary}
                  label="No, Cancel"
                  onTouchTap={this.confirmationDisagreed}
                />,
              ]}
              modal={isModal}
              open={listExport.askingConfirmation}
            >
              You are exporting a large number of items to{' '}
              <strong>
                {(listExport.currentFormatType || '').toUpperCase()}
              </strong>{' '}
              file. This may take a while. Continue?
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
    listFilter: state.filter.listFilter,
    listExport: state.filter.listExport,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      onClearFilter: clearListFilter,
      onChangeFilter: _.flowRight(changeListFilter, Immutable.fromJS),

      askExportConfirmation,
      closeExportConfirmation,
      beginListExportProcessing,
    },
    dispatch
  )
}

export const ListFilterContainer = _.flowRight(
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ListFilter)

export default ListFilterContainer
