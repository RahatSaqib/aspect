import React from 'react'
import { Button } from '@mui/material'
import Immutable from 'immutable'
import isArray from 'lodash/isArray'
import startCase from 'lodash/startCase'
import { MdClose } from 'react-icons/md'
import useAssayList from '../../hooks/assay/useAssayList'
import useDeviceApprovalType from '../../hooks/device/useDeviceApprovalType'
import useDeviceTypeList from '../../hooks/device/useDeviceTypeList'
import useLgaByState from '../../hooks/geography/useLgaByState'
import useStatesByCountry from '../../hooks/geography/useStatesByCountry'
import useConsumable from '../../hooks/inventory/useConsumable'
import useResultCategoryGroup from '../../hooks/result/useResultCategoryGroup'
import useTreatmentStatus from '../../hooks/result/useTreatmentStatus'
import useWorkflowStatus from '../../hooks/result/useWorkflowStatus'
import useI18n from '../../hooks/useI18n'
import { commonDefinitions } from '../../messages/customMessages'
import { getAspectDisplayPreferences } from '../../utils/LocalStorage'
import messages from './messages'

const filtersOrdering = {
  breakOutByLot: 1,
  stateId: 2,
  lgaId: 3,
  assayId: 4,
  resultCategoryId: 5,
  errorCode: 6,
  consumableId: 7,
  sampleId: 8,
  patientOrResearchId: 9,
  deviceName: 10,
  siteName: 11,
  sampleOriginSite: 12,
  originSiteName: 13,
  contactNameOrEmail: 13,
  externalId: 14,
  contactStatus: 15,
  workflowStatusId: 16,
  deviceApprovalId: 17,
  minDate: 18,
  maxDate: 19,
  notificationName: 20,
  treatmentStatus: 21,
  revoked: 21,
  onlyReportableResults: 22,
  reportName: 23,
  onlyTreatmentRequired: 24,
  reportableSiteId: 25,
  reportableSiteName: 26,
  lotNumber: 27,
  hasStock: 28,
  onlyDownloadedByReporter: 29,
  onlyTransfers: 30,
  daysStockLeft: 31,
  minExpirationDate: 31,
  maxExpirationDate: 32,
}

const emptyFilter = filter => {
  const keys = Object.keys(filter)
  return keys.length === 0 || (keys.length === 1 && keys.includes('countryId'))
}

const FilterButtons = ({ filters, remove }) => {
  const { formatMessage } = useI18n()
  return (
    <span>
      {emptyFilter(filters) ? (
        <Btn lbl={formatMessage(messages.noFilters)} />
      ) : (
        Immutable.Map(filters)
          .keySeq()
          .sortBy(filterKey => filtersOrdering[filterKey])
          .map((filterKey, key) => {
            const Comp = buttonMapping[filterKey]
            return <Comp {...filters} remove={remove} key={key} />
          })
      )}
    </span>
  )
}

const buttonMapping = {
  countryId: () => null, // we hide intentionally the country
  stateId: ({ countryId, stateId, remove }) => <StateId countryId={countryId} stateId={stateId} remove={remove} />,
  lgaId: ({ stateId, lgaId, remove }) => <LgaId stateId={stateId} lgaId={lgaId} remove={remove} />,
  siteName: ({ siteName, remove }) => <SiteName siteName={siteName} remove={remove} />,
  originSiteName: ({ originSiteName, remove }) => <OriginSiteName originSiteName={originSiteName} remove={remove} />,
  assayId: ({ assayId, remove }) => <AssayId assayId={assayId} remove={remove} />,
  resultCategoryId: ({ resultCategoryId, assayOverride, assayId, diseaseId, remove }) => (
    <ResultCategoryId
      resultCategoryId={resultCategoryId}
      assayOverride={assayOverride}
      assayId={assayId}
      diseaseId={diseaseId}
      remove={remove}
    />
  ),
  resultCategoryGroupId: ({ resultCategoryGroupId, assayId, assayOverride, remove }) => (
    <ResultCategoryGroupId
      resultCategoryGroupId={resultCategoryGroupId}
      assayId={assayId}
      assayOverride={assayOverride}
      remove={remove}
    />
  ),
  consumableId: ({ consumableId, remove }) => <ConsumableId consumableId={consumableId} remove={remove} />,
  minDate: ({ minDate, remove }) => <MinDate minDate={minDate} remove={remove} />,
  maxDate: ({ maxDate, remove }) => <MaxDate maxDate={maxDate} remove={remove} />,
  minExpirationDate: ({ minExpirationDate, remove }) => (
    <MinExpirationDate minExpirationDate={minExpirationDate} remove={remove} />
  ),
  maxExpirationDate: ({ maxExpirationDate, remove }) => (
    <MaxExpirationDate maxExpirationDate={maxExpirationDate} remove={remove} />
  ),
  reportName: ({ reportName, remove }) => <ReportName reportName={reportName} remove={remove} />,
  externalId: ({ externalId, remove }) => <ExternalId externalId={externalId} remove={remove} />,
  deviceName: ({ deviceName, remove }) => <DeviceName deviceName={deviceName} remove={remove} />,
  contactStatus: ({ contactStatus, remove }) => <ContactStatus contactStatus={contactStatus} remove={remove} />,
  contactNameOrEmail: ({ contactNameOrEmail, remove }) => (
    <ContactNameOrEmail contactNameOrEmail={contactNameOrEmail} remove={remove} />
  ),
  notificationName: ({ notificationName, remove }) => (
    <NotificationName notificationName={notificationName} remove={remove} />
  ),
  onlyTransfers: ({ remove }) => <OnlyTranfers remove={remove} />,
  lotNumber: ({ lotNumber, remove }) => <LotNumber lotNumber={lotNumber} remove={remove} />,
  hasStock: ({ remove }) => <HasStock remove={remove} />,
  breakOutByLot: ({ remove }) => <BreakOutByLot remove={remove} />,
  deviceApprovalId: ({ deviceApprovalId, remove }) => (
    <DeviceApprovalId deviceApprovalId={deviceApprovalId} remove={remove} />
  ),
  deviceMaintenanceStatusId: ({ deviceMaintenanceStatusId, remove }) => (
    <DeviceMaintenanceStatusId deviceMaintenanceStatusId={deviceMaintenanceStatusId} remove={remove} />
  ),
  deviceType: ({ deviceType, remove }) => <DeviceType deviceType={deviceType} remove={remove} />,
  connectorStatus: ({ connectorStatus, remove }) => (
    <ConnectorStatus connectorStatus={connectorStatus} remove={remove} />
  ),
  errorCode: ({ errorCode, remove }) => <ErrorCode errorCode={errorCode} remove={remove} />,
  patientOrResearchId: ({ patientOrResearchId, remove }) => (
    <PatientOrResearchId patientOrResearchId={patientOrResearchId} remove={remove} />
  ),
  sampleId: ({ sampleId, remove }) => <SampleId sampleId={sampleId} remove={remove} />,
  reportableSiteName: ({ reportableSiteName, reportableSiteId, remove }) => (
    <ReportableSiteName reportableSiteName={reportableSiteName} reportableSiteId={reportableSiteId} remove={remove} />
  ),
  reportableSiteId: ({ reportableSiteName, reportableSiteId, remove }) => (
    <ReportableSiteId reportableSiteName={reportableSiteName} reportableSiteId={reportableSiteId} remove={remove} />
  ),
  sampleOriginSite: ({ sampleOriginSite, remove }) => (
    <SampleOriginSiteId sampleOriginSite={sampleOriginSite} remove={remove} />
  ),
  workflowStatusId: ({ workflowStatusId, remove }) => (
    <WorkflowStatusId workflowStatusId={workflowStatusId} remove={remove} />
  ),
  treatmentStatus: ({ treatmentStatus, remove }) => (
    <TreatmentStatus treatmentStatus={treatmentStatus} remove={remove} />
  ),
  displayResult: ({ displayResult, remove }) => <DisplayResult displayResult={displayResult} remove={remove} />,
  onlyReportableResults: ({ remove }) => <OnlyReportableResults remove={remove} />,
  onlyDownloadedByReporter: ({ remove }) => <OnlyDownloadedByReporter remove={remove} />,
  onlyTreatmentRequired: ({ remove }) => <OnlyTreatmentRequired remove={remove} />,
  revoked: ({ revoked, remove }) => <Revoked revoked={revoked} remove={remove} />,
  assayOverride: () => null,
  singleAssayId: ({ singleAssayId }) => <AssayId assayId={singleAssayId} />, // only one permanent
  daysStockLeft: ({ daysStockLeft, remove }) => <DaysStockLeft daysStockLeft={daysStockLeft} remove={remove} />,
}

const Btn = ({ lbl, del }) => {
  return (
    <Button color="secondary" variant="contained" onClick={del} sx={{ m: '2px' }}>
      {lbl.charAt(0).toUpperCase() + lbl.slice(1)}
      {del ? <MdClose style={{ marginLeft: '5px' }} /> : null}
    </Button>
  )
}

const StateId = ({ countryId, stateId, remove }) => {
  const { data } = useStatesByCountry(countryId)
  const lbl = data?.find(s => s.id === stateId)?.name

  return lbl && stateId ? <Btn lbl={lbl} del={() => remove(['stateId', 'lgaId'])} /> : null
}

const LgaId = ({ stateId, lgaId, remove }) => {
  const { data } = useLgaByState(stateId)
  const lbl = data?.find(s => s.id === lgaId)?.name

  return lbl && lgaId ? <Btn lbl={lbl} del={() => remove(['lgaId'])} /> : null
}

const SiteName = ({ siteName, remove }) => {
  const { formatMessage } = useI18n()

  return <Btn lbl={formatMessage(messages.whereSiteNameIncludes, { siteName })} del={() => remove(['siteName'])} />
}

const OriginSiteName = ({ originSiteName, remove }) => {
  const { formatMessage } = useI18n()

  return (
    <Btn
      lbl={formatMessage(messages.whereOriginSiteNameIncludes, { originSiteName })}
      del={() => remove(['originSiteName'])}
    />
  )
}

const AssayId = ({ assayId, remove }) => {
  const { formatMessage } = useI18n()
  const { data } = useAssayList()

  const del = { del: remove ? () => remove(['assayId', 'resultCategoryId']) : undefined } // singleAssayId has no delete option

  if (!data) {
    return null
  }
  return isArray(assayId) ? (
    assayId.map(id => <Btn key={id} lbl={formatMessage(messages[data.find(a => a.id === id).i18nKey])} {...del} />)
  ) : assayId !== -1 ? (
    <Btn lbl={formatMessage(messages[data.find(a => a.id === assayId).i18nKey])} {...del} />
  ) : null
}

const ResultCategoryId = ({ resultCategoryId, assayOverride, assayId, diseaseId, remove }) => {
  const { formatMessage } = useI18n()
  const { data: assays } = useAssayList()
  if (resultCategoryId && assays) {
    const rcName = assays
      .find(a => (isArray(assayId) ? a.id === assayId[0] : a.id === assayId))
      .resultCategories.find(rc => rc.id === resultCategoryId).i18nKey
    // diseaseId here is used to fix filtering from HIV graph
    const rcdName = (
      (assays.find(i => i.diseaseId === diseaseId && i.hasResults) || { resultCategories: [] }).resultCategories.find(
        el => el.id === resultCategoryId
      ) || { i18nKey: '' }
    ).i18nKey
    const name = assayOverride ? `"${startCase(assayOverride)}"` : formatMessage(messages[assayId ? rcName : rcdName])

    const label = formatMessage(messages.withResultCategory, { resultCategoryName: name })

    return <Btn lbl={label} del={() => remove(['resultCategoryId'])} />
  }
  return null
}

const ResultCategoryGroupId = ({ resultCategoryGroupId, assayId, assayOverride, remove }) => {
  const { formatMessage } = useI18n()
  const { data: resultCategoryGroups } = useResultCategoryGroup(assayId, { enabled: !!assayId })
  if (resultCategoryGroupId && resultCategoryGroups) {
    const msg = assayOverride
      ? `"${startCase(assayOverride)}"`
      : formatMessage(messages[resultCategoryGroups.find(it => it.externalId === resultCategoryGroupId).i18nKey])

    return (
      <Btn
        lbl={formatMessage(messages.withResultCategoryGroup, { resultCategoryGroupName: msg })}
        del={() => remove(['resultCategoryGroupId'])}
      />
    )
  }
  return null
}

const ConsumableId = ({ consumableId, remove }) => {
  const { formatMessage } = useI18n()
  const { data } = useConsumable()

  return data && consumableId ? (
    <Btn
      lbl={formatMessage(messages[data.find(a => a.id === consumableId).i18nKey])}
      del={() => remove(['consumableId'])}
    />
  ) : null
}

const MinDate = ({ minDate, remove }) => {
  const { formatMessage, format } = useI18n()
  const { dateFormat } = getAspectDisplayPreferences().toJS()
  const date = format(new Date(minDate), dateFormat)

  return <Btn lbl={formatMessage(messages.dateFrom, { date })} del={() => remove(['minDate'])} />
}

const MaxDate = ({ maxDate, remove }) => {
  const { formatMessage, format } = useI18n()
  const { dateFormat } = getAspectDisplayPreferences().toJS()
  if (!maxDate) return null
  const date = format(new Date(maxDate), dateFormat)

  return <Btn lbl={formatMessage(messages.dateTo, { date })} del={() => remove(['maxDate'])} />
}

const MinExpirationDate = ({ minExpirationDate, remove }) => {
  const { formatMessage, format } = useI18n()
  const { dateFormat } = getAspectDisplayPreferences().toJS()
  const date = format(new Date(minExpirationDate), dateFormat)

  return <Btn lbl={formatMessage(messages.expDateFrom, { date })} del={() => remove(['minExpirationDate'])} />
}

const MaxExpirationDate = ({ maxExpirationDate, remove }) => {
  const { formatMessage, format } = useI18n()
  const { dateFormat } = getAspectDisplayPreferences().toJS()
  const date = format(new Date(maxExpirationDate), dateFormat)

  return <Btn lbl={formatMessage(messages.expDateTo, { date })} del={() => remove(['maxExpirationDate'])} />
}

const ReportName = ({ reportName, remove }) => {
  const { formatMessage } = useI18n()

  return (
    <Btn lbl={formatMessage(messages.whereReportNameIncludes, { reportName })} del={() => remove(['reportName'])} />
  )
}

const ExternalId = ({ externalId, remove }) => {
  const { formatMessage } = useI18n()

  return (
    <Btn lbl={formatMessage(messages.whereExternalIdIncludes, { externalId })} del={() => remove(['externalId'])} />
  )
}

const DeviceName = ({ deviceName, remove }) => {
  const { formatMessage } = useI18n()

  return (
    <Btn lbl={formatMessage(messages.whereDeviceNameIncludes, { deviceName })} del={() => remove(['deviceName'])} />
  )
}

const ContactStatus = ({ contactStatus, remove }) => {
  const { formatMessage } = useI18n()
  const status = formatMessage(commonDefinitions[`${contactStatus}` === '0' ? 'enabled' : 'disabled'])

  return (
    <Btn
      lbl={formatMessage(messages.contactEnabledStatus, { contactStatus: status })}
      del={() => remove(['contactStatus'])}
    />
  )
}

const ContactNameOrEmail = ({ contactNameOrEmail, remove }) => {
  const { formatMessage } = useI18n()

  return (
    <Btn
      lbl={formatMessage(messages.whoseNameOrEmailIncludes, { contactNameOrEmail })}
      del={() => remove(['contactNameOrEmail'])}
    />
  )
}

const NotificationName = ({ notificationName, remove }) => {
  const { formatMessage } = useI18n()

  return (
    <Btn
      lbl={formatMessage(messages.whereNotificationNameIncludes, { notificationName })}
      del={() => remove(['notificationName'])}
    />
  )
}

const OnlyTranfers = ({ remove }) => {
  const { formatMessage } = useI18n()

  return <Btn lbl={formatMessage(messages.onlyTransfers)} del={() => remove(['onlyTransfers'])} />
}

const LotNumber = ({ lotNumber, remove }) => {
  const { formatMessage } = useI18n()

  return <Btn lbl={formatMessage(messages.whereLotNumberIncludes, { lotNumber })} del={() => remove(['lotNumber'])} />
}

const HasStock = ({ remove }) => {
  const { formatMessage } = useI18n()

  return <Btn lbl={formatMessage(messages.hasStock)} del={() => remove(['hasStock'])} />
}

const DaysStockLeft = ({ daysStockLeft, remove }) => {
  const { formatMessage } = useI18n()

  return <Btn lbl={formatMessage(messages[daysStockLeft])} del={() => remove(['daysStockLeft'])} />
}

const BreakOutByLot = ({ remove }) => {
  const { formatMessage } = useI18n()

  return <Btn lbl={formatMessage(messages.breakOutByLot)} del={() => remove(['breakOutByLot'])} />
}

const DeviceApprovalId = ({ deviceApprovalId, remove }) => {
  const { formatMessage } = useI18n()
  const { data } = useDeviceApprovalType()
  const name = data?.find(it => it.id === deviceApprovalId)?.name
  if (deviceApprovalId && name) {
    const deviceApprovalName = formatMessage(messages[`deviceApproval${name}`])
    return (
      <Btn
        lbl={formatMessage(messages.withDeviceApproval, { deviceApprovalName })}
        del={() => remove(['deviceApprovalId'])}
      />
    )
  }
  return null
}

const DeviceType = ({ deviceType, remove }) => {
  const { formatMessage } = useI18n()
  const { data } = useDeviceTypeList()

  if (data && deviceType) {
    const deviceTypeName = data.find(it => it.id === deviceType || it.externalId === deviceType)?.name

    return <Btn lbl={formatMessage(messages.withDeviceType, { deviceTypeName })} del={() => remove(['deviceType'])} />
  }
  return null
}

const DeviceMaintenanceStatusId = ({ deviceMaintenanceStatusId, remove }) => {
  const { formatMessage } = useI18n()
  const ids = isArray(deviceMaintenanceStatusId) ? deviceMaintenanceStatusId : [deviceMaintenanceStatusId]
  return ids.map(id => (
    <Btn
      key={id}
      lbl={formatMessage(messages.withDeviceMaintenanceStatus, {
        deviceMaintenanceStatusName: formatMessage(messages[id]),
      })}
      del={() => remove([`deviceMaintenanceStatusId.${id}`])}
    />
  ))
}

const ConnectorStatus = ({ connectorStatus, remove }) => {
  const { formatMessage } = useI18n()
  const status = formatMessage(messages[connectorStatus])
  return (
    <Btn
      lbl={formatMessage(messages.withConnectorStatus, { connectorStatus: status })}
      del={() => remove(['connectorStatus'])}
    />
  )
}

const ErrorCode = ({ errorCode, remove }) => {
  const { formatMessage } = useI18n()

  return <Btn lbl={formatMessage(messages.errorCode, { errorCode })} del={() => remove(['errorCode'])} />
}

const PatientOrResearchId = ({ patientOrResearchId, remove }) => {
  const { formatMessage } = useI18n()

  return (
    <Btn
      lbl={formatMessage(messages.patientOrResearchId, { patientOrResearchId })}
      del={() => remove(['patientOrResearchId'])}
    />
  )
}

const SampleId = ({ sampleId, remove }) => {
  const { formatMessage } = useI18n()

  return <Btn lbl={formatMessage(messages.sampleId, { sampleId })} del={() => remove(['sampleId'])} />
}

const ReportableSiteName = ({ reportableSiteName, reportableSiteId, remove }) => {
  const { formatMessage } = useI18n()
  const message = reportableSiteId ? messages.whereReportableSiteName : messages.whereReportableSiteNameIncludes
  return (
    <Btn
      lbl={formatMessage(message, { reportableSiteName })}
      del={() => remove(['reportableSiteName', 'reportableSiteId'])}
    />
  )
}

const ReportableSiteId = ({ reportableSiteName, reportableSiteId, remove }) => {
  const { formatMessage } = useI18n()

  return !reportableSiteName ? (
    <Btn
      lbl={formatMessage(messages.whereReportableSiteIdIncludes, { reportableSiteId })}
      del={() => remove(['reportableSiteId'])}
    />
  ) : null
}

const SampleOriginSiteId = ({ sampleOriginSite, remove }) => {
  const { formatMessage } = useI18n()

  return (
    <Btn
      lbl={formatMessage(messages.sampleOriginSite, { sampleOriginSiteName: sampleOriginSite })}
      del={() => remove(['sampleOriginSite'])}
    />
  )
}

const WorkflowStatusId = ({ workflowStatusId, remove }) => {
  const { formatMessage } = useI18n()
  const { data } = useWorkflowStatus()

  if (data) {
    const wfName = data.find(it => it.id === workflowStatusId).i18nKey

    return (
      <Btn
        lbl={formatMessage(messages.withWorkflowStatus, { workflowStatusName: formatMessage(messages[wfName]) })}
        del={() => remove(['workflowStatusId'])}
      />
    )
  }
  return null
}

const TreatmentStatus = ({ treatmentStatus, remove }) => {
  const { formatMessage } = useI18n()
  const { data } = useTreatmentStatus()

  if (data) {
    const treatment = data.find(it => it.externalId === treatmentStatus).i18nKey

    return (
      <Btn
        lbl={formatMessage(messages.withTreatmentStatus, { treatmentStatusName: formatMessage(messages[treatment]) })}
        del={() => remove(['treatmentStatus'])}
      />
    )
  }
  return null
}

const DisplayResult = ({ displayResult, remove }) => {
  const { formatMessage } = useI18n()

  return (
    <Btn
      lbl={formatMessage(messages.withDisplayResult, {
        displayResult: formatMessage(
          messages[`display${displayResult?.charAt(0).toUpperCase() + displayResult?.slice(1)}Results`]
        ),
      })}
      del={() => remove(['displayResult'])}
    />
  )
}

const OnlyReportableResults = ({ remove }) => {
  const { formatMessage } = useI18n()

  return <Btn lbl={formatMessage(messages.onlyReportableResults)} del={() => remove(['onlyReportableResults'])} />
}

const OnlyDownloadedByReporter = ({ remove }) => {
  const { formatMessage } = useI18n()

  return <Btn lbl={formatMessage(messages.onlyDownloadedByReporter)} del={() => remove(['onlyDownloadedByReporter'])} />
}

const OnlyTreatmentRequired = ({ remove }) => {
  const { formatMessage } = useI18n()

  return <Btn lbl={formatMessage(messages.onlyTreatmentRequired)} del={() => remove(['onlyTreatmentRequired'])} />
}

const Revoked = ({ revoked, remove }) => {
  const { formatMessage } = useI18n()

  return (
    <Btn
      lbl={formatMessage(messages.withRevoked, { revokedStatus: revoked === '0' ? 'false' : 'true' })}
      del={() => remove(['revoked'])}
    />
  )
}

export default FilterButtons
