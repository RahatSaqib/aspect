import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogActions, Button } from '@mui/material'
import classnames from 'classnames/bind'
import addYears from 'date-fns/addYears'
import replace from 'lodash/replace'
import { findDOMNode } from 'react-dom'
import { MdKeyboardArrowDown } from 'react-icons/md'
import { connect } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { compose, withHandlers } from 'recompose'
import ErrorBoundary from '../../../components/ErrorBoundary'
import ReportAutoCompleteField from '../../../components/ReportAutocompleteField'
import SiteAutoCompleteField from '../../../components/SiteAutocompleteField'
import useI18n from '../../../hooks/useI18n'
import { getCustomMessage } from '../../../messages'
import {
  exportFormatTypes,
  askExportConfirmation,
  closeExportConfirmation,
  beginListExportProcessing,
} from '../../../store/FilterRedux'
import { getAspectDisplayPreferences } from '../../../utils/LocalStorage'
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
import DisplayResultSelectField from '../resource/DisplayResultSelectField'
import ResultCategoryGroupSelectField from '../resource/ResultCategoryGroupSelectField'
import ResultCategorySelectField from '../resource/ResultCategorySelectField'
import ResultTreatmentStatusSelectField from '../resource/ResultTreatmentStatusSelectField'
import ResultWorkflowStatusSelectField from '../resource/ResultWorkflowStatusSelectField'
import RevokedSelectField from '../resource/RevokedSelectField'
import { mergeToFiltersParams } from '../utils'
import messages from './messages'
import styles from './styles.css'

const cssClasses = classnames.bind(styles)

const enhance = compose(
  connect(
    ({ user, assay, geography, filter }) => ({
      user,
      assays: assay,
      countries: geography.countriesForLocationSelector,
      listExport: filter.listExport,
    }),
    {
      askExportConfirmation,
      closeExportConfirmation,
      beginListExportProcessing,
    }
  ),
  withHandlers({
    onExcelExport: props => () => clickExport(props, exportFormatTypes.EXCEL),
    onCsvExport: props => () => clickExport(props, exportFormatTypes.CSV),
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
  disabled,
  contentClassName,
  filters,
  config,
  dateFilterLabel,
  user,
  assays,
  countries,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isShown, setIsShown] = useState(false)
  const [v, sV] = useState(filters) // intermediate state to call onChangeFilters only once and prevent rerenders
  const { assayId, reportableSiteName, reportableSiteId } = filters
  const assayItems = assays.get('items')
  const { formatMessage } = useI18n()

  const dateFormat = replace(getAspectDisplayPreferences().get('dateFormat'), /-/g, '/')

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
    if (countries.items.size === 1 && (!v.countryId || !countries.items.find(c => c.id === v.countryId))) {
      // pre-select countryId
      const { id } = countries.items.get(0)
      // only country is able to force a URL change and reload, all other filters go to state and on dialog close, applied
      onChangeFilters({ countryId: id, stateId: undefined, lgaId: undefined, siteName: undefined })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries, v])

  const onChangeFilters = nextFilters => {
    const searchParams = new URLSearchParams(location.search)
    const filtersParams = mergeToFiltersParams(nextFilters, new URLSearchParams(searchParams.get('filters') || ''))
    searchParams.set('filters', filtersParams)
    searchParams.delete('pageAt')
    searchParams.delete('page')
    navigate({ ...location, search: `?${searchParams.toString()}` }, { replace: true })
  }

  const onSingleAssayChange = id => sV({ ...v, singleAssayId: id, resultCategoryId: null, resultCategoryGroupId: null })
  const onAssayChange = id => sV({ ...v, assayId: id, resultCategoryId: null, resultCategoryGroupId: null })
  const onDiseaseChange = diseaseId => sV({ ...v, diseaseId })
  const onDateChange = dateValues => sV({ ...v, ...dateValues })
  const onExpirationDateChange = dateValues => sV({ ...v, ...dateValues })
  const onCountryIdChange = id => sV({ ...v, countryId: id, stateId: undefined, lgaId: undefined, siteName: undefined })
  const onStateIdChange = stateId => sV({ ...v, stateId, lgaId: undefined, siteName: undefined })
  const onLgaIdChange = lgaId => sV({ ...v, lgaId, siteName: undefined })
  const onResultCategoryChange = resultCategoryId => sV({ ...v, resultCategoryId })
  const onResultCategoryGroupChange = resultCategoryGroupId => sV({ ...v, resultCategoryGroupId })
  const onTextFieldCommitValue = ({ target: { name, value } }) => sV({ ...v, [name]: value })
  const onConsumableIdChange = consumableId => sV({ ...v, consumableId })
  const onPartnerIdChange = partnerId => sV({ ...v, partnerId })
  const onSampleOriginSiteChange = site => sV({ ...v, sampleOriginSite: site.name })
  const onSiteNameChange = site => sV({ ...v, siteName: site.name })
  const onReportableSiteChange = ({ id, name }) => sV({ ...v, reportableSiteName: name, reportableSiteId: id })
  const onSiteIdChange = site => sV({ ...v, siteId: site.name })
  const onWorkflowStatusIdChange = workflowStatusId => sV({ ...v, workflowStatusId })
  const onTreatmentStatusChange = treatmentStatus => sV({ ...v, treatmentStatus })
  const onDeviceApprovalIdChange = deviceApprovalId => sV({ ...v, deviceApprovalId })
  const onConnectorStatusChange = connectorStatus => sV({ ...v, connectorStatus })
  const onDeviceTypeChange = deviceType => sV({ ...v, deviceType })
  const onDeviceMaintenanceStatusIdChange = deviceMaintenanceStatusId => sV({ ...v, deviceMaintenanceStatusId })
  const onDisplayResultChange = displayResult => sV({ ...v, displayResult })
  const onRevokedChange = revoked => sV({ ...v, revoked })
  const onOnlyReportableResultsBoolChange = onlyReportableResults => sV({ ...v, onlyReportableResults })
  const onOnlyDownloadedByReporterBoolChange = onlyDownloadedByReporter => sV({ ...v, onlyDownloadedByReporter })
  const onOnlyEverTransferredBoolChange = onlyEverTransferred => sV({ ...v, onlyEverTransferred })
  const onOnlyTreatmentRequiredBoolChange = onlyTreatmentRequired => sV({ ...v, onlyTreatmentRequired })
  const onStockLeftChange = daysStockLeft => sV({ ...v, daysStockLeft })
  const onHasStockChange = hasStock => sV({ ...v, hasStock })
  const onOnlyTransfersChange = onlyTransfers => sV({ ...v, onlyTransfers })
  const onReportNameChange = report => sV({ ...v, reportName: report.name })
  const onToggleEnabledDisabled = contactStatus => sV({ ...v, contactStatus })

  return (
    <>
      <AspectButton
        className={cssClasses('Button')}
        color="primary"
        variant="outlined"
        inverse
        disabled={disabled}
        onClick={() => setIsShown(true)}
      >
        <span className={cssClasses('Button__label')}>
          {isShown ? formatMessage(messages.close) : formatMessage(messages.moreFilters)}
        </span>
        <MdKeyboardArrowDown className={cssClasses('Button__icon', { 'Button__icon--shown': isShown })} />
      </AspectButton>
      {isShown ? (
        <Dialog open fullWidth maxWidth={false}>
          <FallbackUntilDone
            component={DialogContent}
            className={cssClasses(contentClassName, 'FallbackUntilDone')}
            fallbacks={[
              { className: cssClasses('FallbackUntilDone--xs') },
              { className: cssClasses('FallbackUntilDone--sm') },
              { className: cssClasses('FallbackUntilDone--md') },
            ]}
            isDone={ref => {
              const node = findDOMNode(ref) // eslint-disable-line react/no-find-dom-node
              const { width, bottom } = node.getBoundingClientRect()
              const { innerWidth, innerHeight } = window
              const aboutToFillHorizontally = width + 200 > innerWidth
              const canFillInVertically = bottom < innerHeight
              return aboutToFillHorizontally || canFillInVertically
            }}
          >
            <ErrorBoundary>
              {config.geography && countries.items.size > 1 && (
                <div className={cssClasses('Control')}>
                  <CountrySelectField
                    allItemText={formatMessage(messages.all)}
                    onCountryIdChange={onCountryIdChange}
                    countryId={v.countryId}
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
                    countryId={v.countryId}
                    stateId={v.stateId}
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
                    countryId={v.countryId}
                    stateId={v.stateId}
                    lgaId={v.lgaId}
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
                    value={v.diseaseId}
                    onDiseaseIdChange={onDiseaseChange}
                    onlyWithResults
                    floatingLabelFixed
                    hintText={formatMessage(messages.selectDisease)}
                    floatingLabelText={formatMessage(messages.disease)}
                    style={{ verticalAlign: 'bottom' }}
                  />
                </div>
              )}

              {config.singleAssayId && !config.onlyDisease && (
                <div className={cssClasses('Control')}>
                  <AssaySelectField
                    value={v.singleAssayId}
                    onAssayChange={onSingleAssayChange}
                    diseaseId={v.diseaseId}
                    floatingLabelFixed
                    hintText={formatMessage(messages.selectAssay)}
                    floatingLabelText={formatMessage(messages.assay)}
                    style={{ verticalAlign: 'bottom' }}
                    multiple={false}
                  />
                </div>
              )}

              {config.assayId && !config.onlyDisease && (
                <div className={cssClasses('Control')}>
                  <AssaySelectField
                    allItemText={formatMessage(messages.all)}
                    value={v.assayId}
                    onAssayChange={onAssayChange}
                    diseaseId={v.diseaseId}
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
                    disabled={!v.assayId}
                    assayId={v.assayId}
                    value={v.resultCategoryId}
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
                    disabled={!v.assayId}
                    assayId={v.assayId}
                    value={v.resultCategoryGroupId}
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
                    value={v.errorCode || ''}
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
                    value={v.consumableId}
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
                    partnerId={v.partnerId}
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
                    value={v.patientOrResearchId || ''}
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
                    value={v.patientOrCaseId || ''}
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
                    value={v.sampleId || ''}
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
                    value={v.deviceName || ''}
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
                    value={v.siteName || ''}
                    onChange={onSiteNameChange}
                    floatingLabelFixed
                    hintText={formatMessage(messages.enterSiteName)}
                    floatingLabelText={formatMessage(messages.site)}
                    stateId={v.stateId}
                    lgaId={v.lgaId}
                  />
                </div>
              )}
              {config.reportableSiteName && (
                <div className={cssClasses('Control')}>
                  <SiteAutoCompleteField
                    name="reportableSiteName"
                    value={v.reportableSiteName || ''}
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
                    value={v.sampleOriginSite || ''}
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
                    value={v.contactNameOrEmail || ''}
                    onCommitValue={onTextFieldCommitValue}
                    InputLabelProps={{ shrink: true }}
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
                    value={v.externalId || ''}
                    onCommitValue={onTextFieldCommitValue}
                    InputLabelProps={{ shrink: true }}
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
                    value={v.workflowStatusId}
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
                    value={v.deviceApprovalId}
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
                    value={v.connectorStatus}
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
                    value={v.deviceMaintenanceStatusId}
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
                    value={v.deviceType}
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
                    value={v.deviceMaintenanceStatusId}
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
                    value={v.notificationName || ''}
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
                  minDate={v.minDate}
                  maxDate={v.maxDate}
                  dateFormat={dateFormat}
                  autoOk
                />
              )}
              {config.expirationDate && (
                <DateRangeSelector
                  floatingLabelText={formatMessage(messages.expirationDate)}
                  onChangeDate={onExpirationDateChange}
                  controlClassName={cssClasses('Control')}
                  minExpirationDate={v.minExpirationDate}
                  maxExpirationDate={v.maxExpirationDate}
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
                    value={v.lotNumber || ''}
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
              {config.revoked && (
                <div className={cssClasses('Control')}>
                  <RevokedSelectField
                    floatingLabelText={formatMessage(messages.revoked)}
                    onRevokedChange={onRevokedChange}
                    allItemText={formatMessage(messages.all)}
                    value={v.revoked}
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
                    value={v.treatmentStatus}
                    onTreatmentStatusChange={onTreatmentStatusChange}
                    floatingLabelFixed
                    hintText={formatMessage(messages.selectTreatmentStatus)}
                    floatingLabelText={formatMessage(messages.treatmentStatus)}
                    style={{ verticalAlign: 'bottom' }}
                    autoWidth
                  />
                </div>
              )}
              {config.displayResult && (
                <div className={cssClasses('Control')}>
                  <DisplayResultSelectField
                    allItemText={formatMessage(messages.all)}
                    value={v.displayResult}
                    onDisplayResultChange={onDisplayResultChange}
                    floatingLabelFixed
                    hintText={formatMessage(messages.selectDisplayResult)}
                    floatingLabelText={formatMessage(messages.displayResult)}
                    style={{ verticalAlign: 'bottom' }}
                    autoWidth
                  />
                </div>
              )}
              {config.siteId && (
                <div className={cssClasses('Control')}>
                  <SiteAutoCompleteField
                    name="siteId"
                    value={v.siteId || ''}
                    onChange={onSiteIdChange}
                    floatingLabelFixed
                    hintText={formatMessage(messages.enterSiteId)}
                    floatingLabelText={formatMessage(messages.siteId)}
                  />
                </div>
              )}
              {config.daysStockLeft && (
                <div className={cssClasses('Control')}>
                  <DaysStockLeftSelectField
                    allItemText={formatMessage(messages.all)}
                    onChange={onStockLeftChange}
                    value={v.daysStockLeft}
                    floatingLabelFixed
                    hintText={formatMessage(messages.selectStockLeft)}
                    floatingLabelText={formatMessage(messages.daysStockLeft)}
                    style={{ verticalAlign: 'bottom' }}
                  />
                </div>
              )}
              {config.reportName && (
                <div className={cssClasses('Control')}>
                  <ReportAutoCompleteField name="reportName" value={v.reportName || ''} onChange={onReportNameChange} />
                </div>
              )}
              {config.contactStatus && (
                <div className={cssClasses('Control')}>
                  <EnabledDisabledPersonsSelectField
                    allItemText={formatMessage(messages.all)}
                    onChange={onToggleEnabledDisabled}
                    name="contactStatus"
                    value={v.contactStatus || ''}
                    floatingLabelFixed
                    hintText={formatMessage(messages.contactStatusHint)}
                    floatingLabelText={formatMessage(messages.contactStatus)}
                    style={{ verticalAlign: 'bottom' }}
                  />
                </div>
              )}
              {config.hasStock && (
                <div className={cssClasses('Control', 'Control-checkbox')}>
                  <CheckboxField
                    classNames={{
                      controlContainer: cssClasses('checkbox-wrapper'),
                    }}
                    checked={[true, 'true'].includes(v.hasStock)}
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
                    checked={[true, 'true'].includes(v.onlyTransfers)}
                    onChange={event => onOnlyTransfersChange(event.target.checked || null)}
                    label={formatMessage(messages.onlyTransfers)}
                    name="onlyTransfers"
                    autoWidth
                  />
                </div>
              )}
              {config.onlyReportableResults && (
                <div className={cssClasses('Control', 'Control-checkbox')}>
                  <CheckboxField
                    classNames={{
                      controlContainer: cssClasses('checkbox-wrapper'),
                    }}
                    checked={[true, 'true'].includes(v.onlyReportableResults)}
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
                    checked={[true, 'true'].includes(v.onlyDownloadedByReporter)}
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
                    checked={[true, 'true'].includes(v.onlyEverTransferred)}
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
                    checked={[true, 'true'].includes(v.onlyTreatmentRequired)}
                    onChange={event => onOnlyTreatmentRequiredBoolChange(event.target.checked || null)}
                    label={formatMessage(messages.onlyTreatmentRequired)}
                    name="onlyTreatmentRequired"
                    autoWidth
                  />
                </div>
              )}
              {/* //TODO: not working, used only to load diseases and make HIV graph work */}
              <div className={cssClasses('Control')}>
                <DiseaseSelectField
                  allItemText={formatMessage(messages.all)}
                  onChange={onToggleEnabledDisabled}
                  name="diseaseId"
                  value={v.diseaseId || ''}
                  floatingLabelFixed
                  hintText={formatMessage(messages.diseaseHint)}
                  floatingLabelText={formatMessage(messages.disease)}
                  style={{ display: 'none' }}
                />
              </div>
            </ErrorBoundary>
          </FallbackUntilDone>
          <DialogActions>
            <Button onClick={() => setIsShown(false)}>{formatMessage(messages.button_Cancel)}</Button>
            <Button onClick={() => onChangeFilters(v)}>{formatMessage(messages.applyFilters)}</Button>
          </DialogActions>
        </Dialog>
      ) : null}
    </>
  )
}

export default enhance(FiltersPanel)
