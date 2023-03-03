import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogActions, Button } from '@mui/material'
import classnames from 'classnames/bind'
import addYears from 'date-fns/addYears'
import isEqual from 'lodash/isEqual'
import replace from 'lodash/replace'
import { findDOMNode } from 'react-dom'
import { MdKeyboardArrowDown } from 'react-icons/md'
import { connect } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import ErrorBoundary from '../../../components/ErrorBoundary'
import ReportAutoCompleteField from '../../../components/ReportAutocompleteField'
import SiteAutoCompleteField from '../../../components/SiteAutocompleteField'
import useI18n from '../../../hooks/useI18n'
import { getCustomMessage } from '../../../messages'
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

const FiltersPanel = props => {
  const { disabled, contentClassName, filters, config, dateFilterLabel, user, assays, countries } = props
  const navigate = useNavigate()
  const location = useLocation()
  const [isShown, setIsShown] = useState(false)
  const [v, sV] = useState(filters) // intermediate state to call onChangeFilters only once and prevent rerenders
  const { assayId, reportableSiteName, reportableSiteId } = v
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

  useEffect(() => {
    if (!isEqual(v, filters)) {
      sV({ ...filters, ...v })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const onChangeFilters = nextFilters => {
    const searchParams = new URLSearchParams(location.search)
    const filtersParams = mergeToFiltersParams(nextFilters, new URLSearchParams(searchParams.get('filters') || ''))
    searchParams.set('filters', filtersParams)
    searchParams.delete('pageAt')
    searchParams.delete('page')
    navigate({ ...location, search: `?${searchParams.toString()}` }, { replace: true })
    setIsShown(false)
  }

  const onCancel = () => {
    sV({})
    setIsShown(false)
  }

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
        <Dialog open>
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
                    onCountryIdChange={id =>
                      sV({ ...v, countryId: id, stateId: undefined, lgaId: undefined, siteName: undefined })
                    }
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
                    onStateIdChange={stateId => sV({ ...v, stateId, lgaId: undefined, siteName: undefined })}
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
                    onLgaIdChange={lgaId => sV({ ...v, lgaId, siteName: undefined })}
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
                    onDiseaseIdChange={diseaseId => sV({ ...v, diseaseId })}
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
                    onAssayChange={id =>
                      sV({ ...v, singleAssayId: id, resultCategoryId: null, resultCategoryGroupId: null })
                    }
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
                    onAssayChange={id => sV({ ...v, assayId: id, resultCategoryId: null, resultCategoryGroupId: null })}
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
                    onResultCategoryChange={resultCategoryId => sV({ ...v, resultCategoryId })}
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
                    onResultCategoryGroupChange={resultCategoryGroupId => sV({ ...v, resultCategoryGroupId })}
                    floatingLabelFixed
                    hintText={formatMessage(messages.selectResult)}
                    floatingLabelText={formatMessage(messages.resultGroup)}
                    style={{ verticalAlign: 'bottom' }}
                  />
                </div>
              )}

              {config.errorCode && (
                <div className={cssClasses('Control')}>
                  <FocusBlurTextField
                    name="errorCode"
                    value={v.errorCode || ''}
                    onCommitValue={({ target: { name, value } }) => sV({ ...v, [name]: value })}
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
                    onConsumableChange={consumableId => sV({ ...v, consumableId })}
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
                    onChangePartner={partnerId => sV({ ...v, partnerId })}
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
                    onCommitValue={({ target: { name, value } }) => sV({ ...v, [name]: value })}
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
                    onCommitValue={({ target: { name, value } }) => sV({ ...v, [name]: value })}
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
                    onCommitValue={({ target: { name, value } }) => sV({ ...v, [name]: value })}
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
                    onCommitValue={({ target: { name, value } }) => sV({ ...v, [name]: value })}
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
                    onChange={site => sV({ ...v, siteName: site.name })}
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
                    onChange={({ id, name }) => sV({ ...v, reportableSiteName: name, reportableSiteId: id })}
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
                    onChange={site => sV({ ...v, sampleOriginSite: site.name })}
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
                    onCommitValue={({ target: { name, value } }) => sV({ ...v, [name]: value })}
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
                    onCommitValue={({ target: { name, value } }) => sV({ ...v, [name]: value })}
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
                    onWorkflowStatusChange={workflowStatusId => sV({ ...v, workflowStatusId })}
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
                    onDeviceApprovalChange={deviceApprovalId => sV({ ...v, deviceApprovalId })}
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
                    onConnectorStatusChange={connectorStatus => sV({ ...v, connectorStatus })}
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
                    onDeviceMaintenanceStatusChange={deviceMaintenanceStatusId =>
                      sV({ ...v, deviceMaintenanceStatusId })
                    }
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
                    onDeviceTypeChange={deviceType => sV({ ...v, deviceType })}
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
                    onDeviceMaintenanceStatusChange={deviceMaintenanceStatusId =>
                      sV({ ...v, deviceMaintenanceStatusId })
                    }
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
                    onCommitValue={({ target: { name, value } }) => sV({ ...v, [name]: value })}
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
                  onChangeDate={dateValues => sV({ ...v, ...dateValues })}
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
                  onChangeDate={dateValues => sV({ ...v, ...dateValues })}
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
                    onCommitValue={({ target: { name, value } }) => sV({ ...v, [name]: value })}
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
                    onRevokedChange={revoked => sV({ ...v, revoked })}
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
                    onTreatmentStatusChange={treatmentStatus => sV({ ...v, treatmentStatus })}
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
                    onDisplayResultChange={displayResult => sV({ ...v, displayResult })}
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
                    onChange={site => sV({ ...v, siteId: site.name })}
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
                    onChange={daysStockLeft => sV({ ...v, daysStockLeft })}
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
                  <ReportAutoCompleteField
                    name="reportName"
                    value={v.reportName || ''}
                    onChange={report => sV({ ...v, reportName: report.name })}
                  />
                </div>
              )}
              {config.contactStatus && (
                <div className={cssClasses('Control')}>
                  <EnabledDisabledPersonsSelectField
                    allItemText={formatMessage(messages.all)}
                    onChange={contactStatus => sV({ ...v, contactStatus })}
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
                    onChange={event => sV({ ...v, hasStock: event.target.checked || null })}
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
                    onChange={event => sV({ ...v, onlyTransfers: event.target.checked || null })}
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
                    onChange={event => sV({ ...v, onlyReportableResults: event.target.checked || null })}
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
                    onChange={event => sV({ ...v, onlyDownloadedByReporter: event.target.checked || null })}
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
                    onChange={event => sV({ ...v, onlyEverTransferred: event.target.checked || null })}
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
                    onChange={event => sV({ ...v, onlyTreatmentRequired: event.target.checked || null })}
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
                  onDiseaseIdChange={diseaseId => sV({ ...v, diseaseId })}
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
            <Button onClick={onCancel}>{formatMessage(messages.button_Cancel)}</Button>
            <Button onClick={() => onChangeFilters(v)}>{formatMessage(messages.applyFilters)}</Button>
          </DialogActions>
        </Dialog>
      ) : null}
    </>
  )
}

export default connect(state => ({
  user: state.user,
  assays: state.assay,
  countries: state.geography.countriesForLocationSelector,
}))(FiltersPanel)
