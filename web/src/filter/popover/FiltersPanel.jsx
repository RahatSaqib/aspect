import classnames from 'classnames/bind'
import { compose, withState, withHandlers } from 'recompose'
import React, { Fragment } from 'react'
import ReactDOM from 'react-dom'
import { defineMessages } from 'react-intl'
import { MdKeyboardArrowDown } from 'react-icons/md'
import Modal from '@material-ui/core/Modal'
import Card from '@material-ui/core/Card'
import { connect } from 'react-redux'

import {
  getCustomMessage,
  commonDefinitions,
} from '../../shared/utils/customMessages'
import FallbackUntilDone from '../../components/shared/FallbackUntilDone'
import FocusBlurTextField from '../../components/shared/FocusBlurTextField'
import CountrySelectField from '../geography/CountrySelectField'
import StateSelectField from '../geography/StateSelectField'
import LgaSelectField from '../geography/LgaSelectField'
import PartnerSelectField from '../partner/PartnerSelectField'
import AssaySelectField from '../resource/AssaySelectField'
import DiseaseSelectField from '../resource/DiseaseSelectField'
import ResultCategorySelectField from '../resource/ResultCategorySelectField'
import ResultCategoryGroupSelectField from '../resource/ResultCategoryGroupSelectField'
import ConsumableSelectField from '../resource/ConsumableSelectField'
import SiteAutoCompleteField from '../resource/SiteAutoCompleteField'
import DateRangeSelector from '../date/DateRangeSelector'
import ResultWorkflowStatusSelectField from '../resource/ResultWorkflowStatusSelectField'
import ResultTreatmentStatusSelectField from '../resource/ResultTreatmentStatusSelectField'
import DeviceApprovalSelectField from '../resource/DeviceApprovalSelectField'
import DeviceTypeSelectField from '../resource/DeviceTypeSelectField'
import AspectButton from '../../components/shared/AspectButton'
import RevokedSelectField from '../resource/RevokedSelectField'
import ResultOnlyReportableResultsSelectField from '../resource/ResultOnlyReportableResultsSelectField'
import DeviceMaintenanceStatusSelectField from '../resource/DeviceMaintenanceStatusSelectField'
import StockLeftSelectField from '../hardcoded/StockLeftSelectField'
import ReportAutoCompleteField from '../resource/ReportAutoCompleteField'

const cssClasses = classnames.bind(require('./FiltersPanel.css'))

const enhance = compose(
  connect(({ user, assay }) => ({
    user,
    assays: assay,
  })),
  withState('isShown', 'setIsShown', false),
  withHandlers({
    onToggleShown: ({ setIsShown }) => () => setIsShown(isShown => !isShown),
    onAssayChange: ({ onChangeFilters }) => assayId =>
      onChangeFilters({
        assayId,
        resultCategoryId: null,
        resultCategoryGroupId: null,
      }),
    onDiseaseChange: ({ onChangeFilters }) => diseaseId =>
      onChangeFilters({ diseaseId }),
    onDateChange: ({ onChangeFilters }) => dateValues =>
      onChangeFilters(dateValues),

    onCountryIdChange: ({ onChangeFilters }) => countryId =>
      onChangeFilters({
        countryId,
        stateId: undefined,
        lgaId: undefined,
      }),

    onStateIdChange: ({ onChangeFilters }) => stateId =>
      onChangeFilters({
        stateId,
        lgaId: undefined,
      }),

    onLgaIdChange: ({ onChangeFilters }) => lgaId =>
      onChangeFilters({
        lgaId,
      }),

    onResultCategoryChange: ({ onChangeFilters }) => resultCategoryId =>
      onChangeFilters({
        resultCategoryId,
      }),

    onResultCategoryGroupChange: ({
      onChangeFilters,
    }) => resultCategoryGroupId =>
      onChangeFilters({
        resultCategoryGroupId,
      }),

    onTextFieldCommitValue: ({ onChangeFilters }) => ({
      target: { name, value },
    }) =>
      onChangeFilters({
        [name]: value,
      }),

    onConsumableIdChange: ({ onChangeFilters }) => consumableId =>
      onChangeFilters({
        consumableId,
      }),

    onPartnerIdChange: ({ onChangeFilters }) => partnerId =>
      onChangeFilters({
        partnerId,
      }),

    onSampleOriginSiteChange: ({ onChangeFilters }) => sampleOriginSite =>
      onChangeFilters({
        sampleOriginSite,
      }),

    onSiteNameChange: ({ onChangeFilters }) => siteName =>
      onChangeFilters({
        siteName,
      }),

    onSiteIdChange: ({ onChangeFilters }) => siteId =>
      onChangeFilters({
        siteId,
      }),

    onWorkflowStatusIdChange: ({ onChangeFilters }) => workflowStatusId =>
      onChangeFilters({
        workflowStatusId,
      }),

    onTreatmentStatusChange: ({ onChangeFilters }) => treatmentStatus =>
      onChangeFilters({
        treatmentStatus,
      }),

    onDeviceApprovalIdChange: ({ onChangeFilters }) => deviceApprovalId =>
      onChangeFilters({
        deviceApprovalId,
      }),
    onDeviceTypeChange: ({ onChangeFilters }) => deviceType =>
      onChangeFilters({
        deviceType,
      }),
    onDeviceMaintenanceStatusIdChange: ({
      onChangeFilters,
    }) => deviceMaintenanceStatusId =>
      onChangeFilters({ deviceMaintenanceStatusId }),
    onRevokedChange: ({ onChangeFilters }) => revoked =>
      onChangeFilters({
        revoked,
      }),

    onExcelExport: props => () =>
      clickExport(props, props.exportFormatTypes.EXCEL),
    onCsvExport: props => () => clickExport(props, props.exportFormatTypes.CSV),

    onDisagreedConfirmation: ({ closeExportConfirmation }) => () =>
      closeExportConfirmation(),
    onAgreedConfirmation: ({
      listExport,
      beginListExportProcessing,
      onClickExport,
      closeExportConfirmation,
    }) => () => {
      beginListExportProcessing(listExport.currentFormatType)
      onClickExport(listExport.currentFormatType)
      closeExportConfirmation()
    },
    onOnlyReportableResultsBoolChange: ({
      onChangeFilters,
    }) => onlyReportableResults =>
      onChangeFilters({
        onlyReportableResults,
      }),

    onStockLeftChange: ({ onChangeFilters }) => stockLeft =>
      onChangeFilters({
        stockLeft,
      }),

    onReportNameChange: ({ onChangeFilters }) => reportName =>
      onChangeFilters({
        reportName,
      }),
  })
)

const clickExport = (
  {
    askConfirmationForExport,
    askExportConfirmation,
    beginListExportProcessing,
    onClickExport,
  },
  formatType
) => {
  if (askConfirmationForExport === true) {
    askExportConfirmation(formatType)
  } else {
    beginListExportProcessing(formatType)
    onClickExport(formatType)
  }
}

const messages = {
  ...commonDefinitions,
  ...defineMessages({
    moreFilters: {
      id: 'filter.popover.moreFilters',
      defaultMessage: 'More filters',
    },
    close: {
      id: 'filter.popover.close',
      defaultMessage: 'Close',
    },
    all: {
      id: 'filter.popover.all',
      defaultMessage: 'All',
    },
    none: {
      id: 'filter.popover.none',
      defaultMessage: 'None',
    },
    contactNameEmail: {
      id: 'filter.popover.contactNameEmail',
      defaultMessage: 'Contact name/email',
    },
    setContactNameEmail: {
      id: 'filter.popover.setContactNameEmail',
      defaultMessage: 'Enter contact name/email...',
    },
    site: {
      id: 'filter.popover.site',
      defaultMessage: 'Site',
    },
    siteId: {
      id: 'filter.popover.siteId',
      defaultMessage: 'Site Id',
    },
    enterSiteName: {
      id: 'filter.popover.enterSiteName',
      defaultMessage: 'Enter site name...',
    },
    enterSiteId: {
      id: 'filter.popover.enterSiteId',
      defaultMessage: 'Enter site ID...',
    },
    sampleOriginSite: {
      id: 'filter.popover.sampleOriginSite',
      defaultMessage: 'Sample collection site',
    },
    enterSampleOriginSite: {
      id: 'filter.popover.enterSampleOriginSite',
      defaultMessage: 'Enter sample origin site name...',
    },
    date: {
      id: 'filter.popover.date',
      defaultMessage: 'Date',
    },
    deviceName: {
      id: 'filter.popover.deviceName',
      defaultMessage: 'Device',
    },
    enterDeviceName: {
      id: 'filter.popover.enterDeviceName',
      defaultMessage: 'Enter device name...',
    },
    consumable: {
      id: 'filter.popover.consumable',
      defaultMessage: 'Consumable',
    },
    selectConsumable: {
      id: 'filter.popover.selectConsumable',
      defaultMessage: 'Select consumable...',
    },
    partner: {
      id: 'filter.popover.partner',
      defaultMessage: 'Partner',
    },
    selectPartner: {
      id: 'filter.popover.selectPartner',
      defaultMessage: 'Select partner...',
    },
    patientOrResearchId: {
      id: 'filter.popover.patientOrResearchId',
      defaultMessage: 'Patient ID',
    },
    enterPatientOrResearchId: {
      id: 'filter.popover.enterPatientOrResearchId',
      defaultMessage: 'Enter patient ID...',
    },
    patientOrCaseId: {
      id: 'filter.popover.patientOrCaseId',
      defaultMessage: 'Patient/Case ID',
    },
    enterPatientOrCaseId: {
      id: 'filter.popover.enterPatientOrCaseId',
      defaultMessage: 'Enter patient/case ID...',
    },
    sampleId: {
      id: 'filter.popover.sampleId',
      defaultMessage: 'Sample ID',
    },
    enterSampleId: {
      id: 'filter.popover.enterSampleId',
      defaultMessage: 'Enter sample ID...',
    },
    errorCode: {
      id: 'filter.popover.errorCode',
      defaultMessage: 'Error Code',
    },
    enterErrorCode: {
      id: 'filter.popover.enterErrorCode',
      defaultMessage: 'Enter error code...',
    },
    result: {
      id: 'filter.popover.result',
      defaultMessage: 'Result',
    },
    selectResult: {
      id: 'filter.popover.selectResult',
      defaultMessage: 'Select result...',
    },
    assay: {
      id: 'filter.popover.assay',
      defaultMessage: 'Assay',
    },
    selectAssay: {
      id: 'filter.popover.selectAssay',
      defaultMessage: 'Select assay...',
    },
    disease: {
      id: 'filter.popover.disease',
      defaultMessage: 'Disease',
    },
    selectDisease: {
      id: 'filter.popover.selectDisease',
      defaultMessage: 'Select Disease...',
    },
    country: {
      id: 'filter.popover.country',
      defaultMessage: 'Country',
    },
    selectCountry: {
      id: 'filter.popover.selectCountry',
      defaultMessage: 'Select country...',
    },
    setFilters: {
      id: 'filter.popover.setFilters',
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
      id: 'filter.popover.workflowStatus',
      defaultMessage: 'Workflow Status',
    },
    selectWorkflowStatus: {
      id: 'filter.popover.selectWorkflowStatus',
      defaultMessage: 'Select status...',
    },
    treatmentStatus: {
      id: 'filter.popover.treatmentStatus',
      defaultMessage: 'Treatment Status',
    },
    selectTreatmentStatus: {
      id: 'filter.popover.selectTreatmentStatus',
      defaultMessage: 'Select status...',
    },
    deviceApproval: {
      id: 'filter.popover.deviceApproval',
      defaultMessage: 'Approval',
    },
    selectDeviceApproval: {
      id: 'filter.popover.selectDeviceApproval',
      defaultMessage: 'Select approval status...',
    },
    deviceType: {
      id: 'filter.popover.deviceType',
      defaultMessage: 'Device Type',
    },
    selectDeviceType: {
      id: 'filter.popover.selectDeviceType',
      defaultMessage: 'Select type...',
    },
    externalId: {
      id: 'filter.popover.externalId',
      defaultMessage: 'Site ID',
    },
    enterExternalId: {
      id: 'filter.popover.enterExternalId',
      defaultMessage: 'Enter site ID...',
    },
    notificationName: {
      id: 'filter.popover.notificationName',
      defaultMessage: 'Notification',
    },
    selectNotificationName: {
      id: 'filter.popover.selectNotificationName',
      defaultMessage: 'Enter notification name...',
    },
    revoked: {
      id: 'filter.popover.revoked',
      defaultMessage: 'Revoked',
    },
    selectRevoked: {
      id: 'filter.popover.selectRevoked',
      defaultMessage: 'Select revoked status...',
    },
    onlyReportableResults: {
      id: 'filter.popover.onlyReportableResults',
      defaultMessage: 'Only Reportable Results',
    },
    deviceMaintenanceStatus: {
      id: 'filter.popover.deviceMaintenanceStatus',
      defaultMessage: 'Maintenance Status',
    },
    selectDeviceMaintenanceStatus: {
      id: 'filter.popover.selectDeviceMaintenanceStatus',
      defaultMessage: 'Select maintenance status...',
    },
    selectStockLeft: {
      id: 'filter.popover.selectStockLeft',
      defaultMessage: 'Select stock left...',
    },
    stockLeft: {
      id: 'filter.popover.stockLeft',
      defaultMessage: 'Days Stock Left',
    },
    reportName: {
      id: 'filter.popover.reportName',
      defaultMessage: 'Report',
    },
    enterReportName: {
      id: 'filter.popover.enterReportName',
      defaultMessage: 'Enter report name...',
    },
  }),
}

export const FiltersPanel = ({
  intl,
  className,
  disabled,
  contentClassName,
  filters,
  config,
  dateFilterLabel,
  // --- injected by recompose ---
  dateFormat,
  onToggleShown,
  isShown,
  onCountryIdChange,
  onStateIdChange,
  onLgaIdChange,
  onAssayChange,
  onDiseaseChange,
  onResultCategoryChange,
  onConsumableIdChange,
  onPartnerIdChange,
  onTextFieldCommitValue,
  onSiteNameChange,
  onSiteIdChange,
  onSampleOriginSiteChange,
  onDateChange,
  onWorkflowStatusIdChange,
  onTreatmentStatusChange,
  onDeviceApprovalIdChange,
  onResultCategoryGroupChange,
  onDeviceMaintenanceStatusIdChange,
  onDeviceTypeChange,
  onRevokedChange,
  onOnlyReportableResultsBoolChange,
  onStockLeftChange,
  onReportNameChange,
  user,
  assays,
}) => {
  const { assayId } = filters
  const assayItems = assays.get('items')
  let assayResultCategory2Label
  if (assayItems && assayId) {
    const selectedAssay = assayItems
      .filter(a => a.get('id') === assayId.toString())
      .get(0)

    if (selectedAssay) {
      const { resultCategory2Label } = selectedAssay.toJS()
      assayResultCategory2Label = resultCategory2Label
    }
  }
  return (
    <div className={cssClasses('Container', className)}>
      <AspectButton
        className={cssClasses('Button')}
        color="primary"
        inverse
        disabled={disabled}
        onClick={onToggleShown}
      >
        <span className={cssClasses('Button__label')}>
          <span
            className={cssClasses('Button__label__close', {
              'Button__label--shown': isShown,
            })}
          >
            {intl.formatMessage(messages.close)}
          </span>
          <span
            className={cssClasses('Button__label__more', {
              'Button__label--shown': !isShown,
            })}
          >
            {intl.formatMessage(messages.moreFilters)}
          </span>
        </span>
        <MdKeyboardArrowDown
          className={cssClasses('Button__icon', {
            'Button__icon--shown': isShown,
          })}
        />
      </AspectButton>

      <Modal
        className={cssClasses('Modal')}
        open={isShown}
        onClose={onToggleShown}
      >
        <Fragment />
      </Modal>

      <div
        className={cssClasses('Popover', {
          'Popover--shown': isShown,
        })}
      >
        <FallbackUntilDone
          component={Card}
          className={cssClasses(contentClassName, 'FallbackUntilDone')}
          fallbacks={[
            {
              className: cssClasses('FallbackUntilDone--xs'),
            },
            {
              className: cssClasses('FallbackUntilDone--sm'),
            },
            {
              className: cssClasses('FallbackUntilDone--md'),
            },
          ]}
          isDone={ref => {
            const node = ReactDOM.findDOMNode(ref) // eslint-disable-line react/no-find-dom-node
            const { width, bottom } = node.getBoundingClientRect()
            const { innerWidth, innerHeight } = window
            const aboutToFillHorizontally = width + 200 > innerWidth
            const canFillInVertically = bottom < innerHeight
            return aboutToFillHorizontally || canFillInVertically
          }}
        >
          {config.geography && (
            <div className={cssClasses('Control')}>
              <CountrySelectField
                allItemText={intl.formatMessage(messages.all)}
                onCountryIdChange={onCountryIdChange}
                countryId={filters.countryId}
                floatingLabelFixed
                hintText={intl.formatMessage(messages.selectCountry)}
                floatingLabelText={intl.formatMessage(messages.country)}
                style={{ verticalAlign: 'bottom' }}
              />
            </div>
          )}
          {config.geography && config.state && (
            <div className={cssClasses('Control')}>
              <StateSelectField
                allItemText={intl.formatMessage(messages.all)}
                onStateIdChange={onStateIdChange}
                countryId={filters.countryId}
                stateId={filters.stateId}
                floatingLabelFixed
                hintText={getCustomMessage(
                  intl,
                  messages,
                  'selectPlaceholder',
                  user,
                  { entity: 'state' }
                )}
                floatingLabelText={getCustomMessage(
                  intl,
                  messages,
                  'state',
                  user
                )}
                style={{ verticalAlign: 'bottom' }}
              />
            </div>
          )}
          {config.geography && config.state && config.lga && (
            <div className={cssClasses('Control')}>
              <LgaSelectField
                allItemText={intl.formatMessage(messages.all)}
                onLgaIdChange={onLgaIdChange}
                countryId={filters.countryId}
                stateId={filters.stateId}
                lgaId={filters.lgaId}
                floatingLabelFixed
                hintText={getCustomMessage(
                  intl,
                  messages,
                  'selectPlaceholder',
                  user,
                  { entity: 'lga' }
                )}
                floatingLabelText={getCustomMessage(
                  intl,
                  messages,
                  'lga',
                  user
                )}
                style={{ verticalAlign: 'bottom' }}
              />
            </div>
          )}
          {config.disease && (
            <div className={cssClasses('Control')}>
              <DiseaseSelectField
                allItemText={intl.formatMessage(messages.all)}
                value={filters.diseaseId}
                onDiseaseIdChange={onDiseaseChange}
                onlyWithResults
                floatingLabelFixed
                hintText={intl.formatMessage(messages.selectDisease)}
                floatingLabelText={intl.formatMessage(messages.disease)}
                style={{ verticalAlign: 'bottom' }}
              />
            </div>
          )}

          {config.assayId && !config.onlyDisease && (
            <div className={cssClasses('Control')}>
              <AssaySelectField
                allItemText={intl.formatMessage(messages.all)}
                value={filters.assayId}
                onAssayChange={onAssayChange}
                diseaseId={filters.diseaseId}
                floatingLabelFixed
                hintText={intl.formatMessage(messages.selectAssay)}
                floatingLabelText={intl.formatMessage(messages.assay)}
                intl={intl}
                style={{ verticalAlign: 'bottom' }}
              />
            </div>
          )}

          {!assayResultCategory2Label &&
            config.resultCategory &&
            !config.onlyDisease && (
              <div className={cssClasses('Control')}>
                <ResultCategorySelectField
                  allItemText={intl.formatMessage(messages.all)}
                  disabled={!filters.assayId}
                  assayId={filters.assayId}
                  value={filters.resultCategoryId}
                  onResultCategoryChange={onResultCategoryChange}
                  floatingLabelFixed
                  hintText={intl.formatMessage(messages.selectResult)}
                  floatingLabelText={intl.formatMessage(messages.result)}
                  style={{ verticalAlign: 'bottom' }}
                  intl={intl}
                />
              </div>
            )}

          {assayResultCategory2Label &&
            config.resultCategoryGroup &&
            !config.onlyDisease && (
              <div className={cssClasses('Control', 'Control--wide')}>
                <ResultCategoryGroupSelectField
                  allItemText={intl.formatMessage(messages.all)}
                  disabled={!filters.assayId}
                  assayId={filters.assayId}
                  value={filters.resultCategoryGroupId}
                  onResultCategoryGroupChange={onResultCategoryGroupChange}
                  floatingLabelFixed
                  hintText={intl.formatMessage(messages.selectResult)}
                  floatingLabelText={intl.formatMessage(messages.result)}
                  style={{ verticalAlign: 'bottom' }}
                  intl={intl}
                />
              </div>
            )}

          {config.errorCode && (
            <div className={cssClasses('Control')}>
              <FocusBlurTextField
                name="errorCode"
                value={filters.errorCode || ''}
                onCommitValue={onTextFieldCommitValue}
                InputLabelProps={{
                  shrink: true,
                }}
                placeholder={intl.formatMessage(messages.enterErrorCode)}
                label={intl.formatMessage(messages.errorCode)}
                margin="normal"
              />
            </div>
          )}
          {config.consumable && (
            <div className={cssClasses('Control')}>
              <ConsumableSelectField
                allItemText={intl.formatMessage(messages.all)}
                value={filters.consumableId}
                onConsumableChange={onConsumableIdChange}
                floatingLabelFixed
                hintText={intl.formatMessage(messages.selectConsumable)}
                floatingLabelText={intl.formatMessage(messages.consumable)}
                style={{ verticalAlign: 'bottom' }}
                autoWidth
              />
            </div>
          )}
          {config.partnerId && (
            <div className={cssClasses('Control')}>
              <PartnerSelectField
                emptyId="-1"
                emptyText={intl.formatMessage(messages.none)}
                partnerId={filters.partnerId}
                onChangePartner={onPartnerIdChange}
                floatingLabelFixed
                hintText={intl.formatMessage(messages.selectPartner)}
                floatingLabelText={intl.formatMessage(messages.partner)}
                style={{ verticalAlign: 'bottom' }}
                autoWidth
              />
            </div>
          )}
          {config.patientOrResearchId && (
            <div className={cssClasses('Control')}>
              <FocusBlurTextField
                name="patientOrResearchId"
                value={filters.patientOrResearchId || ''}
                onCommitValue={onTextFieldCommitValue}
                InputLabelProps={{
                  shrink: true,
                }}
                placeholder={intl.formatMessage(
                  messages.enterPatientOrResearchId
                )}
                label={intl.formatMessage(messages.patientOrResearchId)}
                margin="normal"
              />
            </div>
          )}
          {config.patientOrCaseId && (
            <div className={cssClasses('Control')}>
              <FocusBlurTextField
                name="patientOrCaseId"
                value={filters.patientOrCaseId || ''}
                onCommitValue={onTextFieldCommitValue}
                InputLabelProps={{
                  shrink: true,
                }}
                placeholder={intl.formatMessage(messages.enterPatientOrCaseId)}
                label={intl.formatMessage(messages.patientOrCaseId)}
                margin="normal"
              />
            </div>
          )}
          {config.sampleId && (
            <div className={cssClasses('Control')}>
              <FocusBlurTextField
                name="sampleId"
                value={filters.sampleId || ''}
                onCommitValue={onTextFieldCommitValue}
                InputLabelProps={{
                  shrink: true,
                }}
                placeholder={intl.formatMessage(messages.enterSampleId)}
                label={intl.formatMessage(messages.sampleId)}
                margin="normal"
              />
            </div>
          )}
          {config.deviceName && (
            <div className={cssClasses('Control')}>
              <FocusBlurTextField
                name="deviceName"
                value={filters.deviceName || ''}
                onCommitValue={onTextFieldCommitValue}
                InputLabelProps={{
                  shrink: true,
                }}
                placeholder={intl.formatMessage(messages.enterDeviceName)}
                label={intl.formatMessage(messages.deviceName)}
                margin="normal"
              />
            </div>
          )}
          {config.siteName && (
            <div className={cssClasses('Control')}>
              <SiteAutoCompleteField
                name="siteName"
                value={filters.siteName || ''}
                onSiteNameChange={onSiteNameChange}
                floatingLabelFixed
                hintText={intl.formatMessage(messages.enterSiteName)}
                floatingLabelText={intl.formatMessage(messages.site)}
              />
            </div>
          )}
          {config.sampleOriginSite && (
            <div className={cssClasses('Control')}>
              <SiteAutoCompleteField
                name="sampleOriginSite"
                value={filters.sampleOriginSite || ''}
                onSiteNameChange={onSampleOriginSiteChange}
                floatingLabelFixed
                hintText={intl.formatMessage(messages.enterSampleOriginSite)}
                floatingLabelText={intl.formatMessage(
                  messages.sampleOriginSite
                )}
              />
            </div>
          )}
          {config.contactNameOrEmail && (
            <div className={cssClasses('Control')}>
              <FocusBlurTextField
                name="contactNameOrEmail"
                value={filters.contactNameOrEmail || ''}
                onCommitValue={onTextFieldCommitValue}
                InputLabelProps={{
                  shrink: true,
                }}
                placeholder={intl.formatMessage(messages.setContactNameEmail)}
                label={intl.formatMessage(messages.contactNameEmail)}
                margin="normal"
              />
            </div>
          )}
          {config.externalId && (
            <div className={cssClasses('Control')}>
              <FocusBlurTextField
                name="externalId"
                value={filters.externalId || ''}
                onCommitValue={onTextFieldCommitValue}
                InputLabelProps={{
                  shrink: true,
                }}
                placeholder={intl.formatMessage(messages.enterExternalId)}
                label={intl.formatMessage(messages.externalId)}
                margin="normal"
              />
            </div>
          )}
          {config.workflowStatus && (
            <div className={cssClasses('Control')}>
              <ResultWorkflowStatusSelectField
                allItemText={intl.formatMessage(messages.all)}
                value={filters.workflowStatusId}
                onWorkflowStatusChange={onWorkflowStatusIdChange}
                floatingLabelFixed
                hintText={intl.formatMessage(messages.selectWorkflowStatus)}
                floatingLabelText={intl.formatMessage(messages.workflowStatus)}
                style={{ verticalAlign: 'bottom' }}
                intl={intl}
                autoWidth
              />
            </div>
          )}
          {config.deviceApproval && (
            <div className={cssClasses('Control')}>
              <DeviceApprovalSelectField
                allItemText={intl.formatMessage(messages.all)}
                value={filters.deviceApprovalId}
                onDeviceApprovalChange={onDeviceApprovalIdChange}
                floatingLabelFixed
                hintText={intl.formatMessage(messages.selectDeviceApproval)}
                floatingLabelText={intl.formatMessage(messages.deviceApproval)}
                style={{ verticalAlign: 'bottom' }}
                autoWidth
                intl={intl}
              />
            </div>
          )}
          {config.deviceType && (
            <div className={cssClasses('Control')}>
              <DeviceTypeSelectField
                allItemText={intl.formatMessage(messages.all)}
                value={filters.deviceType}
                onDeviceTypeChange={onDeviceTypeChange}
                floatingLabelFixed
                hintText={intl.formatMessage(messages.selectDeviceType)}
                floatingLabelText={intl.formatMessage(messages.deviceType)}
                style={{ verticalAlign: 'bottom' }}
                autoWidth
                intl={intl}
              />
            </div>
          )}
          {config.deviceMaintenanceStatus && (
            <div className={cssClasses('Control')}>
              <DeviceMaintenanceStatusSelectField
                value={filters.deviceMaintenanceStatusId}
                onDeviceMaintenanceStatusChange={
                  onDeviceMaintenanceStatusIdChange
                }
                floatingLabelFixed
                hintText={intl.formatMessage(
                  messages.selectDeviceMaintenanceStatus
                )}
                floatingLabelText={intl.formatMessage(
                  messages.deviceMaintenanceStatus
                )}
                style={{ verticalAlign: 'bottom' }}
                autoWidth
              />
            </div>
          )}
          {config.notificationName && (
            <div className={cssClasses('Control')}>
              <FocusBlurTextField
                name="notificationName"
                value={filters.notificationName || ''}
                onCommitValue={onTextFieldCommitValue}
                InputLabelProps={{
                  shrink: true,
                }}
                placeholder={intl.formatMessage(
                  messages.selectNotificationName
                )}
                label={intl.formatMessage(messages.notificationName)}
                margin="normal"
              />
            </div>
          )}
          {config.date && (
            <DateRangeSelector
              floatingLabelText={
                dateFilterLabel || intl.formatMessage(messages.date)
              }
              onChangeDate={onDateChange}
              controlClassName={cssClasses('Control')}
              minDate={filters.minDate}
              maxDate={filters.maxDate}
              dateFormat={dateFormat}
              autoOk
            />
          )}

          {config.revoked && (
            <div className={cssClasses('Control')}>
              <RevokedSelectField
                floatingLabelText={intl.formatMessage(messages.revoked)}
                onRevokedChange={onRevokedChange}
                allItemText={intl.formatMessage(messages.all)}
                value={filters.revoked}
                floatingLabelFixed
                hintText={intl.formatMessage(messages.selectRevoked)}
                style={{ verticalAlign: 'bottom' }}
              />
            </div>
          )}
          {config.treatmentStatus && (
            <div className={cssClasses('Control')}>
              <ResultTreatmentStatusSelectField
                allItemText={intl.formatMessage(messages.all)}
                value={filters.treatmentStatus}
                onTreatmentStatusChange={onTreatmentStatusChange}
                floatingLabelFixed
                hintText={intl.formatMessage(messages.selectTreatmentStatus)}
                floatingLabelText={intl.formatMessage(messages.treatmentStatus)}
                style={{ verticalAlign: 'bottom' }}
                autoWidth
              />
            </div>
          )}
          {config.siteId && (
            <div className={cssClasses('Control')}>
              <SiteAutoCompleteField
                name="siteId"
                value={filters.siteId || ''}
                onSiteNameChange={onSiteIdChange}
                floatingLabelFixed
                hintText={intl.formatMessage(messages.enterSiteId)}
                floatingLabelText={intl.formatMessage(messages.siteId)}
              />
            </div>
          )}
          {config.onlyReportableResults && (
            <div className={cssClasses('Control')}>
              <ResultOnlyReportableResultsSelectField
                value={filters.onlyReportableResults}
                onOnlyReportableResultsChange={
                  onOnlyReportableResultsBoolChange
                }
                floatingLabelText={intl.formatMessage(
                  messages.onlyReportableResults
                )}
                style={{ verticalAlign: 'bottom' }}
                autoWidth
              />
            </div>
          )}
          {config.stockLeft && (
            <div className={cssClasses('Control')}>
              <StockLeftSelectField
                allItemText={intl.formatMessage(messages.all)}
                onChange={onStockLeftChange}
                value={filters.stockLeft}
                floatingLabelFixed
                hintText={intl.formatMessage(messages.selectStockLeft)}
                floatingLabelText={intl.formatMessage(messages.stockLeft)}
                style={{ verticalAlign: 'bottom' }}
              />
            </div>
          )}
          {config.reportName && (
            <div className={cssClasses('Control')}>
              <ReportAutoCompleteField
                name="reportName"
                value={filters.reportName || ''}
                onReportNameChange={onReportNameChange}
                floatingLabelFixed
                hintText={intl.formatMessage(messages.enterReportName)}
                floatingLabelText={intl.formatMessage(messages.reportName)}
              />
            </div>
          )}
        </FallbackUntilDone>
      </div>
    </div>
  )
}

export default enhance(FiltersPanel)
