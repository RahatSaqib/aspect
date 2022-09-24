import React, { Fragment, useEffect } from 'react'
import { Card, Modal } from '@mui/material'
import classnames from 'classnames/bind'
import addYears from 'date-fns/addYears'
import ReactDOM from 'react-dom'
import { MdKeyboardArrowDown } from 'react-icons/md'
import { connect } from 'react-redux'
import { compose, withState, withHandlers } from 'recompose'
import ErrorBoundary from '../../../components/ErrorBoundary'
import ReportAutoCompleteField from '../../../components/ReportAutocompleteField'
import SiteAutoCompleteField from '../../../components/SiteAutocompleteField'
import useI18n from '../../../hooks/useI18n'
import { getCustomMessage } from '../../../messages'
import AspectButton from '../../shared/AspectButton'
import CheckboxField from '../../shared/CheckboxField'
import FallbackUntilDone from '../../shared/FallbackUntilDone'
import FocusBlurTextField from '../../shared/FocusBlurTextField'
import DateRangeSelector from '../date/DateRangeSelector'
import CountrySelectField from '../geography/CountrySelectField'
import LgaSelectField from '../geography/LgaSelectField'
import StateSelectField from '../geography/StateSelectField'
import DaysStockLeftSelectField from '../hardcoded/daysStockLeftSelectField'
import EnabledDisabledPersonsSelectField from '../hardcoded/toggleDisabledEnabledPersons'
import PartnerSelectField from '../partner/PartnerSelectField'
import AssaySelectField from '../resource/AssaySelectField'
import ConnectorStatusSelectField from '../resource/ConnectorStatusSelectField'
import ConsumableSelectField from '../resource/ConsumableSelectField'
import DeviceApprovalSelectField from '../resource/DeviceApprovalSelectField'
import DeviceMaintenanceStatusSelectField from '../resource/DeviceMaintenanceStatusSelectField'
import DeviceStatusSelectField from '../resource/DeviceStatusSelectField'
import DeviceTypeSelectField from '../resource/DeviceTypeSelectField'
import DiseaseSelectField from '../resource/DiseaseSelectField'
import ResultCategoryGroupSelectField from '../resource/ResultCategoryGroupSelectField'
import ResultCategorySelectField from '../resource/ResultCategorySelectField'
import ResultTreatmentStatusSelectField from '../resource/ResultTreatmentStatusSelectField'
import ResultWorkflowStatusSelectField from '../resource/ResultWorkflowStatusSelectField'
import RevokedSelectField from '../resource/RevokedSelectField'
import { isCountryFilterHidden } from '../utils'
import styles from './FiltersPanel.css'
import messages from './messages'

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
    onExpirationDateChange:
      ({ onChangeFilters }) =>
      dateValues =>
        onChangeFilters(dateValues),
    onChange:
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
    onConnectorStatusChange:
      ({ onChangeFilters }) =>
      connectorStatus =>
        onChangeFilters({
          connectorStatus,
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
    onExcelExport: props => () => clickExport(props, props.exportFormatTypes.EXCEL),
    onCsvExport: props => () => clickExport(props, props.exportFormatTypes.CSV),
    onDisagreedConfirmation:
      ({ closeExportConfirmation }) =>
      () =>
        closeExportConfirmation(),
    onAgreedConfirmation:
      ({ listExport, beginListExportProcessing, onClickExport, closeExportConfirmation }) =>
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
    onOnlyTransfersChange:
      ({ onChangeFilters }) =>
      onlyTransfers =>
        onChangeFilters({
          onlyTransfers,
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
  { askConfirmationForExport, askExportConfirmation, beginListExportProcessing, onClickExport },
  formatType
) => {
  if (askConfirmationForExport === true) {
    askExportConfirmation(formatType)
  } else {
    beginListExportProcessing(formatType)
    onClickExport(formatType)
  }
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
  onOnlyTransfersChange,
  onSampleOriginSiteChange,
  onDateChange,
  onWorkflowStatusIdChange,
  onTreatmentStatusChange,
  onDeviceApprovalIdChange,
  onConnectorStatusChange,
  onResultCategoryGroupChange,
  onDeviceMaintenanceStatusIdChange,
  onDeviceTypeChange,
  onRevokedChange,
  onExpirationDateChange,
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
    const selectedAssay = assayItems.filter(a => a.get('id') === assayId.toString()).get(0)

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
      (!filters.countryId || !countries.items.find(it => it.id === filters.countryId))
    ) {
      // pre-select countryId
      const { id } = countries.items.get(0)
      onCountryIdChange(id)
    }
  }, [countries, filters, onCountryIdChange])

  const showCountryFilter = React.useMemo(() => !isCountryFilterHidden(countries), [countries])

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

      <Modal className={cssClasses('Modal')} open={isShown} onClose={onToggleShown}>
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
                  hintText={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'state' })}
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
                  hintText={getCustomMessage(messages, 'selectPlaceholder', user, { entity: 'lga' })}
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

            {!assayResultCategory2Label && config.resultCategory && !config.onlyDisease && (
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

            {assayResultCategory2Label && config.resultCategoryGroup && !config.onlyDisease && (
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
            {config.connectorStatus && (
              <div className={cssClasses('Control')}>
                <ConnectorStatusSelectField
                  value={filters.connectorStatus}
                  onConnectorStatusChange={onConnectorStatusChange}
                  floatingLabelFixed
                  hintText={formatMessage(messages.selectConnectorStatus)}
                  floatingLabelText={formatMessage(messages.connectorStatus)}
                  autoWidth
                />
              </div>
            )}
            {config.deviceStatus && (
              <div className={cssClasses('Control')}>
                <DeviceStatusSelectField
                  value={filters.deviceMaintenanceStatusId}
                  onDeviceMaintenanceStatusChange={onDeviceMaintenanceStatusIdChange}
                  floatingLabelFixed
                  hintText={formatMessage(messages.selectDeviceStatus)}
                  floatingLabelText={formatMessage(messages.deviceStatus)}
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
                  multiple
                  allItemText={formatMessage(messages.all)}
                  value={filters.deviceMaintenanceStatusId}
                  onDeviceMaintenanceStatusChange={onDeviceMaintenanceStatusIdChange}
                  floatingLabelFixed
                  hintText={formatMessage(messages.selectDeviceMaintenanceStatus)}
                  floatingLabelText={formatMessage(messages.deviceMaintenanceStatus)}
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
                floatingLabelText={dateFilterLabel || formatMessage(messages.date)}
                onChangeDate={onDateChange}
                controlClassName={cssClasses('Control')}
                minDate={filters.minDate}
                maxDate={filters.maxDate}
                dateFormat={dateFormat}
                autoOk
              />
            )}

            {config.expirationDate && (
              <DateRangeSelector
                floatingLabelText={formatMessage(messages.expirationDate)}
                onChangeDate={onExpirationDateChange}
                controlClassName={cssClasses('Control')}
                minExpirationDate={filters.minExpirationDate}
                maxExpirationDate={filters.maxExpirationDate}
                minFilterName="minExpirationDate"
                maxFilterName="maxExpirationDate"
                dateFormat={dateFormat}
                maxDateTo={addYears(new Date(), 3)}
                enableDayFilter={false}
                enableWeekFilter={false}
                enableQuarterFilter={false}
                enableMonthFilter={false}
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
                  onChange={event => onHasStockChange(event.target.checked || null)}
                  label={formatMessage(messages.hasStock)}
                  name="onlyHasStock"
                  autoWidth
                />
              </div>
            )}
            {config.onlyTransfers && (
              <div className={cssClasses('Control', 'Control-checkbox')}>
                <CheckboxField
                  classNames={{
                    controlContainer: cssClasses('checkbox-wrapper'),
                  }}
                  checked={[true, 'true'].includes(filters.onlyTransfers)}
                  onChange={event => onOnlyTransfersChange(event.target.checked || null)}
                  label={formatMessage(messages.onlyTransfers)}
                  name="onlyTransfers"
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
                  checked={[true, 'true'].includes(filters.onlyReportableResults)}
                  onChange={event => onOnlyReportableResultsBoolChange(event.target.checked || null)}
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
                  checked={[true, 'true'].includes(filters.onlyDownloadedByReporter)}
                  onChange={event => onOnlyDownloadedByReporterBoolChange(event.target.checked || null)}
                  label={formatMessage(messages.onlyDownloadedByReporter)}
                  name="onlyDownloadedByReporter"
                  autoWidth
                />
              </div>
            )}
            {(reportableSiteName || reportableSiteId) && config.onlyEverTransferred && (
              <div className={cssClasses('Control', 'Control-checkbox')}>
                <CheckboxField
                  classNames={{
                    controlContainer: cssClasses('checkbox-wrapper'),
                  }}
                  checked={[true, 'true'].includes(filters.onlyEverTransferred)}
                  onChange={event => onOnlyEverTransferredBoolChange(event.target.checked || null)}
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
                  checked={[true, 'true'].includes(filters.onlyTreatmentRequired)}
                  onChange={event => onOnlyTreatmentRequiredBoolChange(event.target.checked || null)}
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
