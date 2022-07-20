import classnames from 'classnames/bind'
import { compose, withState, withHandlers } from 'recompose'
import React, { Fragment, useEffect } from 'react'
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
import { isCountryFilterHidden } from '../utils'
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
import SiteAutoCompleteField from '../../MigratedComponents/SiteAutocompleteField'
import DateRangeSelector from '../date/DateRangeSelector'
import ResultWorkflowStatusSelectField from '../resource/ResultWorkflowStatusSelectField'
import ResultTreatmentStatusSelectField from '../resource/ResultTreatmentStatusSelectField'
import DeviceApprovalSelectField from '../resource/DeviceApprovalSelectField'
import DeviceTypeSelectField from '../resource/DeviceTypeSelectField'
import AspectButton from '../../components/shared/AspectButton'
import RevokedSelectField from '../resource/RevokedSelectField'
import CheckboxField from '../../components/shared/CheckboxField'
import DeviceMaintenanceStatusSelectField from '../resource/DeviceMaintenanceStatusSelectField'
import DaysStockLeftSelectField from '../hardcoded/daysStockLeftSelectField'
import EnabledDisabledPersonsSelectField from '../hardcoded/toggleDisabledEnabledPersons'
import ReportAutoCompleteField from '../../MigratedComponents/ReportAutocompleteField'
import ErrorBoundary from '../../MigratedComponents/ErrorBoundary'
import useI18n from '../../Hooks/i18n/useI18n'

import styles from './FiltersPanel.css'

const cssClasses = classnames.bind(styles)

const enhance = compose(
  connect(({ user, assay, geography }) => ({
    user,
    assays: assay,
    countries: geography.countriesForLocationSelector,
  })),
  withState('isShown', 'setIsShown', false),
  withHandlers({
    onToggleShown:
      ({ setIsShown }) =>
      () =>
        setIsShown(isShown => !isShown),
    onAssayChange:
      ({ onChangeFilters }) =>
      assayId =>
        onChangeFilters({
          assayId,
          resultCategoryId: null,
          resultCategoryGroupId: null,
        }),
    onDiseaseChange:
      ({ onChangeFilters }) =>
      diseaseId =>
        onChangeFilters({ diseaseId }),
    onDateChange:
      ({ onChangeFilters }) =>
      dateValues =>
        onChangeFilters(dateValues),

    onCountryIdChange:
      ({ onChangeFilters }) =>
      countryId =>
        onChangeFilters({
          countryId,
          stateId: undefined,
          lgaId: undefined,
        }),
    onStateIdChange:
      ({ onChangeFilters }) =>
      stateId =>
        onChangeFilters({
          stateId,
          lgaId: undefined,
        }),
    onLgaIdChange:
      ({ onChangeFilters }) =>
      lgaId =>
        onChangeFilters({
          lgaId,
        }),
    onResultCategoryChange:
      ({ onChangeFilters }) =>
      resultCategoryId =>
        onChangeFilters({
          resultCategoryId,
        }),
    onResultCategoryGroupChange:
      ({ onChangeFilters }) =>
      resultCategoryGroupId =>
        onChangeFilters({
          resultCategoryGroupId,
        }),
    onTextFieldCommitValue:
      ({ onChangeFilters }) =>
      ({ target: { name, value } }) =>
        onChangeFilters({
          [name]: value,
        }),
    onConsumableIdChange:
      ({ onChangeFilters }) =>
      consumableId =>
        onChangeFilters({
          consumableId,
        }),
    onPartnerIdChange:
      ({ onChangeFilters }) =>
      partnerId =>
        onChangeFilters({
          partnerId,
        }),
    onSampleOriginSiteChange:
      ({ onChangeFilters }) =>
      site =>
        onChangeFilters({ sampleOriginSite: site.name }),
    onSiteNameChange:
      ({ onChangeFilters }) =>
      site =>
        onChangeFilters({ siteName: site.name }),
    onReportableSiteChange:
      ({ onChangeFilters }) =>
      ({ id, name }) => {
        onChangeFilters({ reportableSiteName: name, reportableSiteId: id })
      },
    onSiteIdChange:
      ({ onChangeFilters }) =>
      site =>
        onChangeFilters({ siteId: site.name }),
    onWorkflowStatusIdChange:
      ({ onChangeFilters }) =>
      workflowStatusId =>
        onChangeFilters({
          workflowStatusId,
        }),
    onTreatmentStatusChange:
      ({ onChangeFilters }) =>
      treatmentStatus =>
        onChangeFilters({
          treatmentStatus,
        }),
    onDeviceApprovalIdChange:
      ({ onChangeFilters }) =>
      deviceApprovalId =>
        onChangeFilters({
          deviceApprovalId,
        }),
    onDeviceTypeChange:
      ({ onChangeFilters }) =>
      deviceType =>
        onChangeFilters({
          deviceType,
        }),
    onDeviceMaintenanceStatusIdChange:
      ({ onChangeFilters }) =>
      deviceMaintenanceStatusId =>
        onChangeFilters({ deviceMaintenanceStatusId }),
    onRevokedChange:
      ({ onChangeFilters }) =>
      revoked =>
        onChangeFilters({
          revoked,
        }),
    onExcelExport: props => () =>
      clickExport(props, props.exportFormatTypes.EXCEL),
    onCsvExport: props => () => clickExport(props, props.exportFormatTypes.CSV),
    onDisagreedConfirmation:
      ({ closeExportConfirmation }) =>
      () =>
        closeExportConfirmation(),
    onAgreedConfirmation:
      ({
        listExport,
        beginListExportProcessing,
        onClickExport,
        closeExportConfirmation,
      }) =>
      () => {
        beginListExportProcessing(listExport.currentFormatType)
        onClickExport(listExport.currentFormatType)
        closeExportConfirmation()
      },
    onOnlyReportableResultsBoolChange:
      ({ onChangeFilters }) =>
      onlyReportableResults =>
        onChangeFilters({
          onlyReportableResults,
        }),
    onOnlyDownloadedByReporterBoolChange:
      ({ onChangeFilters }) =>
      onlyDownloadedByReporter =>
        onChangeFilters({
          onlyDownloadedByReporter,
        }),
    onOnlyEverTransferredBoolChange:
      ({ onChangeFilters }) =>
      onlyEverTransferred =>
        onChangeFilters({
          onlyEverTransferred,
        }),
    onOnlyTreatmentRequiredBoolChange:
      ({ onChangeFilters }) =>
      onlyTreatmentRequired =>
        onChangeFilters({
          onlyTreatmentRequired,
        }),
    onStockLeftChange:
      ({ onChangeFilters }) =>
      daysStockLeft =>
        onChangeFilters({
          daysStockLeft,
        }),
    onHasStockChange:
      ({ onChangeFilters }) =>
      hasStock =>
        onChangeFilters({
          hasStock,
        }),
    onReportNameChange:
      ({ onChangeFilters }) =>
      report => {
        onChangeFilters({ reportName: report.name })
      },
    onToggleEnabledDisabled:
      ({ onChangeFilters }) =>
      contactStatus =>
        onChangeFilters({
          contactStatus,
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
      id: 'filter.popover.siteName',
      defaultMessage: 'Site',
    },
    reportableSite: {
      id: 'filter.popover.site',
      defaultMessage: 'Reportable Site',
    },
    siteId: {
      id: 'filter.popover.siteId',
      defaultMessage: 'Site Id',
    },
    enterSiteName: {
      id: 'filter.popover.enterSiteName',
      defaultMessage: 'Enter site name...',
    },
    enterReportableSiteName: {
      id: 'filter.popover.enterReportableSiteName',
      defaultMessage: 'Enter reportable site name...',
    },
    enterReportableSiteId: {
      id: 'filter.popover.enterReportableSiteId',
      defaultMessage: 'Enter reportable site...',
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
    onlyDownloadedByReporter: {
      id: 'filter.popover.onlyDownloadedByReporter',
      defaultMessage: 'Only Results Downloaded By Reporter',
    },
    onlyEverTransferred: {
      id: 'filter.popover.onlyEverTransferred',
      defaultMessage: 'Only Ever Transferred Results',
    },
    onlyTreatmentRequired: {
      id: 'filter.popover.onlyTreatmentRequired',
      defaultMessage: 'Only Results With Treatment Required',
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
    daysStockLeft: {
      id: 'filter.popover.daysStockLeft',
      defaultMessage: 'Days Stock Left',
    },
    hasStock: {
      id: 'filter.popover.hasStock',
      defaultMessage: 'Has Stock',
    },
    lotNumber: {
      id: 'filter.popover.lotNumber',
      defaultMessage: 'Lot Number',
    },
    enterLotNumber: {
      id: 'filter.popover.enterLotNumber',
      defaultMessage: 'Enter lot number...',
    },
    contactStatus: {
      id: 'filter.popover.contactStatus',
      defaultMessage: 'Contact Status',
    },
    contactStatusHint: {
      id: 'filter.popover.contactStatusHint',
      defaultMessage: 'Select contact status...',
    },
  }),
}

export const FiltersPanel = ({
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
  onReportableSiteChange,
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
  onOnlyDownloadedByReporterBoolChange,
  onOnlyEverTransferredBoolChange,
  onOnlyTreatmentRequiredBoolChange,
  onStockLeftChange,
  onHasStockChange,
  onReportNameChange,
  onToggleEnabledDisabled,
  user,
  assays,
  countries,
}) => {
  const { assayId, reportableSiteName, reportableSiteId } = filters
  const assayItems = assays.get('items')
  const { formatMessage } = useI18n()
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

  /**
   * - when country filter is hidden because only 1 country is accessible for user
   * - and this country is not selected yet in Filter Panel
   * --> then explicitly select it for filter
   */
  useEffect(() => {
    if (
      isCountryFilterHidden(countries) &&
      /**
       * current filter does NOT have `countryId` defined
       */
      (!filters.countryId ||
        !countries.items.find(it => it.id === filters.countryId))
    ) {
      // pre-select countryId
      const { id } = countries.items.get(0)
      onCountryIdChange(id)
    }
  }, [countries, filters, onCountryIdChange])

  const showCountryFilter = React.useMemo(
    () => !isCountryFilterHidden(countries),
    [countries]
  )

  return (
    <div className={cssClasses('Container', className)}>
      <AspectButton
        className={cssClasses('Button')}
        color="primary"
        variant="outlined"
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
            {formatMessage(messages.close)}
          </span>
          <span
            className={cssClasses('Button__label__more', {
              'Button__label--shown': !isShown,
            })}
          >
            {formatMessage(messages.moreFilters)}
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
          <ErrorBoundary>
            {config.geography && showCountryFilter && (
              <div className={cssClasses('Control')}>
                <CountrySelectField
                  allItemText={formatMessage(messages.all)}
                  onCountryIdChange={onCountryIdChange}
                  countryId={filters.countryId}
                  floatingLabelFixed
                  hintText={formatMessage(messages.selectCountry)}
                  floatingLabelText={formatMessage(messages.country)}
                  style={{ verticalAlign: 'bottom' }}
                />
              </div>
            )}
            {config.geography && config.state && (
              <div className={cssClasses('Control')}>
                <StateSelectField
                  allItemText={formatMessage(messages.all)}
                  onStateIdChange={onStateIdChange}
                  countryId={filters.countryId}
                  stateId={filters.stateId}
                  floatingLabelFixed
                  hintText={getCustomMessage(
                    messages,
                    'selectPlaceholder',
                    user,
                    { entity: 'state' }
                  )}
                  floatingLabelText={getCustomMessage(messages, 'state', user)}
                  style={{ verticalAlign: 'bottom' }}
                />
              </div>
            )}
            {config.geography && config.state && config.lga && (
              <div className={cssClasses('Control')}>
                <LgaSelectField
                  allItemText={formatMessage(messages.all)}
                  onLgaIdChange={onLgaIdChange}
                  countryId={filters.countryId}
                  stateId={filters.stateId}
                  lgaId={filters.lgaId}
                  floatingLabelFixed
                  hintText={getCustomMessage(
                    messages,
                    'selectPlaceholder',
                    user,
                    { entity: 'lga' }
                  )}
                  floatingLabelText={getCustomMessage(messages, 'lga', user)}
                  style={{ verticalAlign: 'bottom' }}
                />
              </div>
            )}
            {config.disease && (
              <div className={cssClasses('Control')}>
                <DiseaseSelectField
                  allItemText={formatMessage(messages.all)}
                  value={filters.diseaseId}
                  onDiseaseIdChange={onDiseaseChange}
                  onlyWithResults
                  floatingLabelFixed
                  hintText={formatMessage(messages.selectDisease)}
                  floatingLabelText={formatMessage(messages.disease)}
                  style={{ verticalAlign: 'bottom' }}
                />
              </div>
            )}

            {config.assayId && !config.onlyDisease && (
              <div className={cssClasses('Control')}>
                <AssaySelectField
                  allItemText={formatMessage(messages.all)}
                  value={filters.assayId}
                  onAssayChange={onAssayChange}
                  diseaseId={filters.diseaseId}
                  floatingLabelFixed
                  hintText={formatMessage(messages.selectAssay)}
                  floatingLabelText={formatMessage(messages.assay)}
                  style={{ verticalAlign: 'bottom' }}
                />
              </div>
            )}

            {!assayResultCategory2Label &&
              config.resultCategory &&
              !config.onlyDisease && (
                <div className={cssClasses('Control')}>
                  <ResultCategorySelectField
                    allItemText={formatMessage(messages.all)}
                    disabled={!filters.assayId}
                    assayId={filters.assayId}
                    value={filters.resultCategoryId}
                    onResultCategoryChange={onResultCategoryChange}
                    floatingLabelFixed
                    hintText={formatMessage(messages.selectResult)}
                    floatingLabelText={formatMessage(messages.result)}
                    style={{ verticalAlign: 'bottom' }}
                  />
                </div>
              )}

            {assayResultCategory2Label &&
              config.resultCategoryGroup &&
              !config.onlyDisease && (
                <div className={cssClasses('Control', 'Control--wide')}>
                  <ResultCategoryGroupSelectField
                    allItemText={formatMessage(messages.all)}
                    disabled={!filters.assayId}
                    assayId={filters.assayId}
                    value={filters.resultCategoryGroupId}
                    onResultCategoryGroupChange={onResultCategoryGroupChange}
                    floatingLabelFixed
                    hintText={formatMessage(messages.selectResult)}
                    floatingLabelText={formatMessage(messages.result)}
                    style={{ verticalAlign: 'bottom' }}
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
                  placeholder={formatMessage(messages.enterErrorCode)}
                  label={formatMessage(messages.errorCode)}
                  margin="normal"
                />
              </div>
            )}
            {config.consumable && (
              <div className={cssClasses('Control')}>
                <ConsumableSelectField
                  allItemText={formatMessage(messages.all)}
                  value={filters.consumableId}
                  onConsumableChange={onConsumableIdChange}
                  floatingLabelFixed
                  hintText={formatMessage(messages.selectConsumable)}
                  floatingLabelText={formatMessage(messages.consumable)}
                  style={{ verticalAlign: 'bottom' }}
                  autoWidth
                />
              </div>
            )}
            {config.partnerId && (
              <div className={cssClasses('Control')}>
                <PartnerSelectField
                  emptyId="-1"
                  emptyText={formatMessage(messages.none)}
                  partnerId={filters.partnerId}
                  onChangePartner={onPartnerIdChange}
                  floatingLabelFixed
                  hintText={formatMessage(messages.selectPartner)}
                  floatingLabelText={formatMessage(messages.partner)}
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
                  placeholder={formatMessage(messages.enterPatientOrResearchId)}
                  label={formatMessage(messages.patientOrResearchId)}
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
                  placeholder={formatMessage(messages.enterPatientOrCaseId)}
                  label={formatMessage(messages.patientOrCaseId)}
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
                  placeholder={formatMessage(messages.enterSampleId)}
                  label={formatMessage(messages.sampleId)}
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
                  placeholder={formatMessage(messages.enterDeviceName)}
                  label={formatMessage(messages.deviceName)}
                  margin="normal"
                />
              </div>
            )}
            {config.siteName && (
              <div className={cssClasses('Control')}>
                <SiteAutoCompleteField
                  name="siteName"
                  value={filters.siteName || ''}
                  onChange={onSiteNameChange}
                  floatingLabelFixed
                  hintText={formatMessage(messages.enterSiteName)}
                  floatingLabelText={formatMessage(messages.site)}
                />
              </div>
            )}
            {config.reportableSiteName && (
              <div className={cssClasses('Control')}>
                <SiteAutoCompleteField
                  name="reportableSiteName"
                  value={filters.reportableSiteName || ''}
                  onChange={onReportableSiteChange}
                  floatingLabelFixed
                  hintText={formatMessage(messages.enterReportableSiteName)}
                  floatingLabelText={formatMessage(messages.reportableSite)}
                />
              </div>
            )}
            {config.sampleOriginSite && (
              <div className={cssClasses('Control')}>
                <SiteAutoCompleteField
                  name="sampleOriginSite"
                  value={filters.sampleOriginSite || ''}
                  onChange={onSampleOriginSiteChange}
                  floatingLabelFixed
                  hintText={formatMessage(messages.enterSampleOriginSite)}
                  floatingLabelText={formatMessage(messages.sampleOriginSite)}
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
                  placeholder={formatMessage(messages.setContactNameEmail)}
                  label={formatMessage(messages.contactNameEmail)}
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
                  placeholder={formatMessage(messages.enterExternalId)}
                  label={formatMessage(messages.externalId)}
                  margin="normal"
                />
              </div>
            )}
            {config.workflowStatus && (
              <div className={cssClasses('Control')}>
                <ResultWorkflowStatusSelectField
                  allItemText={formatMessage(messages.all)}
                  value={filters.workflowStatusId}
                  onWorkflowStatusChange={onWorkflowStatusIdChange}
                  floatingLabelFixed
                  hintText={formatMessage(messages.selectWorkflowStatus)}
                  floatingLabelText={formatMessage(messages.workflowStatus)}
                  style={{ verticalAlign: 'bottom' }}
                  autoWidth
                />
              </div>
            )}
            {config.deviceApproval && (
              <div className={cssClasses('Control')}>
                <DeviceApprovalSelectField
                  allItemText={formatMessage(messages.all)}
                  value={filters.deviceApprovalId}
                  onDeviceApprovalChange={onDeviceApprovalIdChange}
                  floatingLabelFixed
                  hintText={formatMessage(messages.selectDeviceApproval)}
                  floatingLabelText={formatMessage(messages.deviceApproval)}
                  style={{ verticalAlign: 'bottom' }}
                  autoWidth
                />
              </div>
            )}
            {config.deviceType && (
              <div className={cssClasses('Control')}>
                <DeviceTypeSelectField
                  allItemText={formatMessage(messages.all)}
                  value={filters.deviceType}
                  onDeviceTypeChange={onDeviceTypeChange}
                  floatingLabelFixed
                  hintText={formatMessage(messages.selectDeviceType)}
                  floatingLabelText={formatMessage(messages.deviceType)}
                  style={{ verticalAlign: 'bottom' }}
                  autoWidth
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
                  hintText={formatMessage(
                    messages.selectDeviceMaintenanceStatus
                  )}
                  floatingLabelText={formatMessage(
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
                  placeholder={formatMessage(messages.selectNotificationName)}
                  label={formatMessage(messages.notificationName)}
                  margin="normal"
                />
              </div>
            )}
            {config.date && (
              <DateRangeSelector
                floatingLabelText={
                  dateFilterLabel || formatMessage(messages.date)
                }
                onChangeDate={onDateChange}
                controlClassName={cssClasses('Control')}
                minDate={filters.minDate}
                maxDate={filters.maxDate}
                dateFormat={dateFormat}
                autoOk
              />
            )}
            {config.lotNumber && (
              <div className={cssClasses('Control')}>
                <FocusBlurTextField
                  name="lotNumber"
                  value={filters.lotNumber || ''}
                  onCommitValue={onTextFieldCommitValue}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  placeholder={formatMessage(messages.enterLotNumber)}
                  label={formatMessage(messages.lotNumber)}
                  margin="normal"
                />
              </div>
            )}
            {config.hasStock && (
              <div className={cssClasses('Control', 'Control-checkbox')}>
                <CheckboxField
                  classNames={{
                    controlContainer: cssClasses('checkbox-wrapper'),
                  }}
                  checked={[true, 'true'].includes(filters.hasStock)}
                  onChange={event =>
                    onHasStockChange(event.target.checked || null)
                  }
                  label={formatMessage(messages.hasStock)}
                  name="onlyHasStock"
                  autoWidth
                />
              </div>
            )}
            {config.revoked && (
              <div className={cssClasses('Control')}>
                <RevokedSelectField
                  floatingLabelText={formatMessage(messages.revoked)}
                  onRevokedChange={onRevokedChange}
                  allItemText={formatMessage(messages.all)}
                  value={filters.revoked}
                  floatingLabelFixed
                  hintText={formatMessage(messages.selectRevoked)}
                  style={{ verticalAlign: 'bottom' }}
                />
              </div>
            )}
            {config.treatmentStatus && (
              <div className={cssClasses('Control')}>
                <ResultTreatmentStatusSelectField
                  allItemText={formatMessage(messages.all)}
                  value={filters.treatmentStatus}
                  onTreatmentStatusChange={onTreatmentStatusChange}
                  floatingLabelFixed
                  hintText={formatMessage(messages.selectTreatmentStatus)}
                  floatingLabelText={formatMessage(messages.treatmentStatus)}
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
                  onChange={onSiteIdChange}
                  floatingLabelFixed
                  hintText={formatMessage(messages.enterSiteId)}
                  floatingLabelText={formatMessage(messages.siteId)}
                />
              </div>
            )}
            {config.onlyReportableResults && (
              <div className={cssClasses('Control', 'Control-checkbox')}>
                <CheckboxField
                  classNames={{
                    controlContainer: cssClasses('checkbox-wrapper'),
                  }}
                  checked={[true, 'true'].includes(
                    filters.onlyReportableResults
                  )}
                  onChange={event =>
                    onOnlyReportableResultsBoolChange(
                      event.target.checked || null
                    )
                  }
                  label={formatMessage(messages.onlyReportableResults)}
                  name="onlyReportableResults"
                  autoWidth
                />
              </div>
            )}
            {config.onlyDownloadedByReporter && (
              <div className={cssClasses('Control', 'Control-checkbox')}>
                <CheckboxField
                  classNames={{
                    controlContainer: cssClasses('checkbox-wrapper'),
                  }}
                  checked={[true, 'true'].includes(
                    filters.onlyDownloadedByReporter
                  )}
                  onChange={event =>
                    onOnlyDownloadedByReporterBoolChange(
                      event.target.checked || null
                    )
                  }
                  label={formatMessage(messages.onlyDownloadedByReporter)}
                  name="onlyDownloadedByReporter"
                  autoWidth
                />
              </div>
            )}
            {(reportableSiteName || reportableSiteId) &&
              config.onlyEverTransferred && (
                <div className={cssClasses('Control', 'Control-checkbox')}>
                  <CheckboxField
                    classNames={{
                      controlContainer: cssClasses('checkbox-wrapper'),
                    }}
                    checked={[true, 'true'].includes(
                      filters.onlyEverTransferred
                    )}
                    onChange={event =>
                      onOnlyEverTransferredBoolChange(
                        event.target.checked || null
                      )
                    }
                    label={formatMessage(messages.onlyEverTransferred)}
                    name="onlyEverTransferred"
                    autoWidth
                  />
                </div>
              )}
            {config.onlyTreatmentRequired && (
              <div className={cssClasses('Control', 'Control-checkbox')}>
                <CheckboxField
                  classNames={{
                    controlContainer: cssClasses('checkbox-wrapper'),
                  }}
                  checked={[true, 'true'].includes(
                    filters.onlyTreatmentRequired
                  )}
                  onChange={event =>
                    onOnlyTreatmentRequiredBoolChange(
                      event.target.checked || null
                    )
                  }
                  label={formatMessage(messages.onlyTreatmentRequired)}
                  name="onlyTreatmentRequired"
                  autoWidth
                />
              </div>
            )}
            {config.daysStockLeft && (
              <div className={cssClasses('Control')}>
                <DaysStockLeftSelectField
                  allItemText={formatMessage(messages.all)}
                  onChange={onStockLeftChange}
                  value={filters.daysStockLeft}
                  floatingLabelFixed
                  hintText={formatMessage(messages.selectStockLeft)}
                  floatingLabelText={formatMessage(messages.daysStockLeft)}
                  style={{ verticalAlign: 'bottom' }}
                />
              </div>
            )}
            {config.reportName && (
              <div className={cssClasses('Control')}>
                <ReportAutoCompleteField
                  name="reportName"
                  value={filters.reportName || ''}
                  onChange={onReportNameChange}
                />
              </div>
            )}
            {config.contactStatus && (
              <div className={cssClasses('Control')}>
                <EnabledDisabledPersonsSelectField
                  allItemText={formatMessage(messages.all)}
                  onChange={onToggleEnabledDisabled}
                  name="contactStatus"
                  value={filters.contactStatus || ''}
                  floatingLabelFixed
                  hintText={formatMessage(messages.contactStatusHint)}
                  floatingLabelText={formatMessage(messages.contactStatus)}
                  style={{ verticalAlign: 'bottom' }}
                />
              </div>
            )}
          </ErrorBoundary>
        </FallbackUntilDone>
      </div>
    </div>
  )
}

export default enhance(FiltersPanel)
