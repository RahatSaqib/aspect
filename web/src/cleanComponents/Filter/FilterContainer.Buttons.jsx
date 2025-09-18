import React from 'react'
import { Button } from '@mui/material'
import Immutable from 'immutable'
import { pull } from 'lodash/array'
import isArray from 'lodash/isArray'
import startCase from 'lodash/startCase'
import { MdClose } from 'react-icons/md'
import { useIntl } from 'react-intl'
import useAssayList from '../../hooks/assay/useAssayList'
import useDeviceApprovalType from '../../hooks/device/useDeviceApprovalType'
import useDeviceTypeList from '../../hooks/device/useDeviceTypeList'
import useLgaByState from '../../hooks/geography/useLgaByState'
import useStatesByCountry from '../../hooks/geography/useStatesByCountry'
import { useConsumable } from '../../hooks/inventory/useConsumable'
import useNotificationType from '../../hooks/notification/useNotificationType'
import useResultCategoryGroup from '../../hooks/result/useResultCategoryGroup'
import useTreatmentStatus from '../../hooks/result/useTreatmentStatus'
import useWorkflowStatus from '../../hooks/result/useWorkflowStatus'
import useSiteList from '../../hooks/site/useSiteList'
import useSiteType from '../../hooks/site/useSiteType'
import { commonDefinitions } from '../../messages/customMessages'
import { getAspectDisplayPreferences } from '../../oldComponents/LocalStorage'
import { cepheidModulesOptions } from '../CepheidModulesSelect/CepheidModulesSelect'
import { notificationCategories } from '../NotificationCategorySelect/fixture'
import messages from './messages'

const emptyFilter = filter => {
  const keys = Object.keys(filter)
  return keys.length === 0 || (keys.length === 1 && keys.includes('countryId'))
}

const filtersOrdering = {
  breakOutByLot: 10,
  stateId: 20,
  lgaId: 30,
  assayId: 40,
  resultCategoryId: 50,
  errorCode: 60,
  consumableId: 70,
  sampleId: 80,
  patientOrResearchId: 90,
  deviceName: 100,
  siteName: 110,
  siteId: 120,
  sampleOriginSite: 130,
  originSiteName: 140,
  contactNameOrEmail: 150,
  destinationSiteName: 160,
  externalId: 170,
  contactStatus: 180,
  workflowStatusId: 190,
  deviceApprovalId: 200,
  minDate: 210,
  maxDate: 220,
  notificationName: 230,
  treatmentStatus: 240,
  revoked: 250,
  onlyReportableResults: 260,
  reportName: 270,
  onlyTreatmentRequired: 280,
  reportableSiteId: 290,
  reportableSiteName: 300,
  lotNumber: 310,
  hasStock: 320,
  onlyDownloadedByReporter: 330,
  onlyTransfers: 340,
  daysStockLeft: 350,
  minExpirationDate: 360,
  maxExpirationDate: 370,
  showDecommissionedDevices: 380,
  siteTypeId: 390,
  parentWarehouseId: 400,
}

const buttonMapping = {
  countryId: () => null, // we hide intentionally the country
  stateId: ({ countryId, stateId, remove, blocked }) => (
    <StateId countryId={countryId} stateId={stateId} remove={remove} blocked={blocked} />
  ),
  lgaId: ({ stateId, lgaId, remove, blocked }) => (
    <LgaId stateId={stateId} lgaId={lgaId} remove={remove} blocked={blocked} />
  ),
  siteName: ({ siteName, remove, blocked }) => <SiteName siteName={siteName} remove={remove} blocked={blocked} />,
  parentWarehouseId: ({ parentWarehouseId, remove, blocked }) => (
    <ParentWarehouseId parentWarehouseId={parentWarehouseId} remove={remove} blocked={blocked} />
  ),
  siteTypeId: ({ siteTypeId, remove, blocked }) => (
    <SiteTypeId siteTypeId={siteTypeId} remove={remove} blocked={blocked} />
  ),
  lgaName: ({ lgaName, remove, blocked }) => <LgaName lgaName={lgaName} remove={remove} blocked={blocked} />,
  stateName: ({ stateName, remove, blocked }) => <StateName stateName={stateName} remove={remove} blocked={blocked} />,
  originSiteName: ({ originSiteName, remove, blocked }) => (
    <OriginSiteName originSiteName={originSiteName} remove={remove} blocked={blocked} />
  ),
  destinationSiteName: ({ destinationSiteName, remove, blocked }) => (
    <DestinationSiteName destinationSiteName={destinationSiteName} remove={remove} blocked={blocked} />
  ),
  assayId: ({ assayId, remove, append, resultCategoryGroupId, blocked }) => (
    <AssayId
      assayId={assayId}
      remove={remove}
      append={append}
      resultCategoryGroupId={resultCategoryGroupId}
      blocked={blocked}
    />
  ),
  resultCategoryId: ({ resultCategoryId, assayOverride, assayId, diseaseId, remove, blocked }) => (
    <ResultCategoryId
      resultCategoryId={resultCategoryId}
      assayOverride={assayOverride}
      assayId={assayId}
      diseaseId={diseaseId}
      remove={remove}
      blocked={blocked}
    />
  ),
  resultCategoryGroupId: ({ resultCategoryGroupId, assayId, assayOverride, remove, append, blocked }) => (
    <ResultCategoryGroupId
      resultCategoryGroupId={resultCategoryGroupId}
      assayId={assayId}
      assayOverride={assayOverride}
      remove={remove}
      append={append}
      blocked={blocked}
    />
  ),
  consumableId: ({ consumableId, remove, blocked }) => (
    <ConsumableId consumableId={consumableId} remove={remove} blocked={blocked} />
  ),
  minDate: ({ minDate, remove, blocked }) => <MinDate minDate={minDate} remove={remove} blocked={blocked} />,
  maxDate: ({ maxDate, remove, blocked }) => <MaxDate maxDate={maxDate} remove={remove} blocked={blocked} />,
  minExpirationDate: ({ minExpirationDate, remove, blocked }) => (
    <MinExpirationDate minExpirationDate={minExpirationDate} remove={remove} blocked={blocked} />
  ),
  maxExpirationDate: ({ maxExpirationDate, remove, blocked }) => (
    <MaxExpirationDate maxExpirationDate={maxExpirationDate} remove={remove} blocked={blocked} />
  ),
  reportName: ({ reportName, remove, blocked }) => (
    <ReportName reportName={reportName} remove={remove} blocked={blocked} />
  ),
  externalId: ({ externalId, remove, blocked }) => (
    <ExternalId externalId={externalId} remove={remove} blocked={blocked} />
  ),
  deviceName: ({ deviceName, remove, blocked }) => (
    <DeviceName deviceName={deviceName} remove={remove} blocked={blocked} />
  ),
  contactStatus: ({ contactStatus, remove, blocked }) => (
    <ContactStatus contactStatus={contactStatus} remove={remove} blocked={blocked} />
  ),
  contactNameOrEmail: ({ contactNameOrEmail, remove, blocked }) => (
    <ContactNameOrEmail contactNameOrEmail={contactNameOrEmail} remove={remove} blocked={blocked} />
  ),
  notificationName: ({ notificationName, remove, blocked }) => (
    <NotificationName notificationName={notificationName} remove={remove} blocked={blocked} />
  ),
  onlyTransfers: ({ remove, blocked }) => <OnlyTranfers remove={remove} blocked={blocked} />,
  lotNumber: ({ lotNumber, remove, blocked }) => <LotNumber lotNumber={lotNumber} remove={remove} blocked={blocked} />,
  hasStock: ({ remove, blocked }) => <HasStock remove={remove} blocked={blocked} />,
  breakOutByLot: ({ remove, blocked }) => <BreakOutByLot remove={remove} blocked={blocked} />,
  deviceApprovalId: ({ deviceApprovalId, remove, blocked }) => (
    <DeviceApprovalId deviceApprovalId={deviceApprovalId} remove={remove} blocked={blocked} />
  ),
  deviceMaintenanceStatusId: ({ deviceMaintenanceStatusId, remove, blocked }) => (
    <DeviceMaintenanceStatusId
      deviceMaintenanceStatusId={deviceMaintenanceStatusId}
      remove={remove}
      blocked={blocked}
    />
  ),
  deviceType: ({ deviceType, remove, blocked }) => (
    <DeviceType deviceType={deviceType} remove={remove} blocked={blocked} />
  ),
  geneXpertType: ({ geneXpertType, remove, blocked }) => (
    <GeneXpertType geneXpertType={geneXpertType} remove={remove} blocked={blocked} />
  ),
  connectorStatus: ({ connectorStatus, remove, blocked }) => (
    <ConnectorStatus connectorStatus={connectorStatus} remove={remove} blocked={blocked} />
  ),
  errorCode: ({ errorCode, remove, blocked }) => <ErrorCode errorCode={errorCode} remove={remove} blocked={blocked} />,
  patientOrResearchId: ({ patientOrResearchId, remove, blocked }) => (
    <PatientOrResearchId patientOrResearchId={patientOrResearchId} remove={remove} blocked={blocked} />
  ),
  issueTypeId: ({ issueTypeId, remove, blocked }) => (
    <IssueTypeId issueTypeId={issueTypeId} remove={remove} blocked={blocked} />
  ),
  sampleId: ({ sampleId, remove, blocked }) => <SampleId sampleId={sampleId} remove={remove} blocked={blocked} />,
  reportableSiteName: ({ reportableSiteName, reportableSiteId, remove, blocked }) => (
    <ReportableSiteName
      reportableSiteName={reportableSiteName}
      reportableSiteId={reportableSiteId}
      remove={remove}
      blocked={blocked}
    />
  ),
  reportableSiteId: ({ reportableSiteName, reportableSiteId, remove, blocked }) => (
    <ReportableSiteId
      reportableSiteName={reportableSiteName}
      reportableSiteId={reportableSiteId}
      remove={remove}
      blocked={blocked}
    />
  ),
  sampleOriginSite: ({ sampleOriginSite, remove, blocked }) => (
    <SampleOriginSiteId sampleOriginSite={sampleOriginSite} remove={remove} blocked={blocked} />
  ),
  workflowStatusId: ({ workflowStatusId, remove, blocked }) => (
    <WorkflowStatusId workflowStatusId={workflowStatusId} remove={remove} blocked={blocked} />
  ),
  treatmentStatus: ({ treatmentStatus, remove, blocked }) => (
    <TreatmentStatus treatmentStatus={treatmentStatus} remove={remove} blocked={blocked} />
  ),
  displayResult: ({ displayResult, remove, blocked }) => (
    <DisplayResult displayResult={displayResult} remove={remove} blocked={blocked} />
  ),
  onlyReportableResults: ({ remove, blocked }) => <OnlyReportableResults remove={remove} blocked={blocked} />,
  onlyDownloadedByReporter: ({ remove, blocked }) => <OnlyDownloadedByReporter remove={remove} blocked={blocked} />,
  onlyTreatmentRequired: ({ remove, blocked }) => <OnlyTreatmentRequired remove={remove} blocked={blocked} />,
  showDecommissionedDevices: ({ remove, blocked }) => <ShowDecommissionedDevices remove={remove} blocked={blocked} />,
  onlyUnreconciled: ({ remove, blocked }) => <OnlyUnreconciled remove={remove} blocked={blocked} />,
  revoked: ({ revoked, remove, blocked }) => <Revoked revoked={revoked} remove={remove} blocked={blocked} />,
  assayOverride: () => null,
  singleAssayId: ({ singleAssayId }) => <AssayId assayId={singleAssayId} />, // only one permanent
  daysStockLeft: ({ daysStockLeft, remove, blocked }) => (
    <DaysStockLeft daysStockLeft={daysStockLeft} remove={remove} blocked={blocked} />
  ),
  onlyErrors: ({ remove, blocked }) => <OnlyErrors remove={remove} blocked={blocked} />,
  reportWithName: ({ remove, reportWithName, blocked }) => (
    <ReportWithName reportWithName={reportWithName} remove={remove} blocked={blocked} />
  ),
  patientId: ({ remove, patientId, blocked }) => <PatientId patientId={patientId} remove={remove} blocked={blocked} />,
  notificationCategory: ({ remove, notificationCategory, blocked }) => (
    <NotificationCategory notificationCategory={notificationCategory} remove={remove} blocked={blocked} />
  ),
  notificationTypeId: ({ remove, notificationCategoryTypeId, notificationTypeId, blocked }) => (
    <NotificationType
      notificationTypeCategoryId={notificationCategoryTypeId}
      notificationTypeId={notificationTypeId}
      remove={remove}
      blocked={blocked}
    />
  ),
}

const FilterButtons = ({ filters, remove, append, blocked }) => {
  const { formatMessage } = useIntl()
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
            if (!Comp) return null
            return <Comp key={key} {...filters} remove={remove} append={append} blocked={blocked ?? []} />
          })
      )}
    </span>
  )
}

const Btn = ({ lbl, del }) => {
  return (
    <Button color="secondary" variant="contained" onClick={del} sx={{ m: '2px' }}>
      {lbl.charAt(0).toUpperCase() + lbl.slice(1)}
      {del ? <MdClose style={{ marginLeft: '5px' }} /> : null}
    </Button>
  )
}

const StateId = ({ countryId, stateId, remove, blocked }) => {
  const { data } = useStatesByCountry({ countryId })
  const lbl = data?.find(s => s.id === stateId)?.name

  return lbl && stateId ? (
    <Btn lbl={lbl} del={blocked.includes('stateId') ? undefined : () => remove(['stateId', 'lgaId'])} />
  ) : null
}

const LgaId = ({ stateId, lgaId, remove, blocked }) => {
  const { data } = useLgaByState({ stateId })
  const lbl = data?.find(s => s.id === lgaId)?.name

  return lbl && lgaId ? <Btn lbl={lbl} del={blocked.includes('lgaId') ? undefined : () => remove(['lgaId'])} /> : null
}

const SiteName = ({ siteName, remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.whereSiteNameIncludes, { siteName })}
      del={blocked.includes('siteName') ? undefined : () => remove(['siteName'])}
    />
  )
}

const ParentWarehouseId = ({ parentWarehouseId, remove, blocked }) => {
  const { formatMessage } = useIntl()
  const { data } = useSiteList()
  const stockProvider = data?.find(i => i.id === parentWarehouseId)

  return (
    <Btn
      lbl={formatMessage(messages.whereStockProviderIs, { stockProvider: stockProvider.name })}
      del={blocked.includes('parentWarehouseId') ? undefined : () => remove(['parentWarehouseId'])}
    />
  )
}
const SiteTypeId = ({ siteTypeId, remove, blocked }) => {
  const { formatMessage } = useIntl()
  const { data } = useSiteType()
  const type = data?.find(i => i.id === siteTypeId)

  return (
    <Btn
      lbl={formatMessage(messages.whereSiteTypeIs, { siteType: type.name })}
      del={blocked.includes('siteTypeId') ? undefined : () => remove(['siteTypeId'])}
    />
  )
}
const LgaName = ({ lgaName, remove, blocked }) => {
  const { formatMessage } = useIntl()
  return (
    <Btn
      lbl={formatMessage(messages.whereLgaNameIncludes, { lgaName })}
      del={blocked.includes('lgaName') ? undefined : () => remove(['lgaName'])}
    />
  )
}

const StateName = ({ stateName, remove, blocked }) => {
  const { formatMessage } = useIntl()
  return (
    <Btn
      lbl={formatMessage(messages.whereStateNameIncludes, { stateName })}
      del={blocked.includes('stateName') ? undefined : () => remove(['stateName'])}
    />
  )
}

const OriginSiteName = ({ originSiteName, remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.whereOriginSiteNameIncludes, { originSiteName })}
      del={blocked.includes('originSiteName') ? undefined : () => remove(['originSiteName'])}
    />
  )
}

const DestinationSiteName = ({ destinationSiteName, remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.whereDestinationSiteNameIncludes, { destinationSiteName })}
      del={blocked.includes('destinationSiteName') ? undefined : () => remove(['destinationSiteName'])}
    />
  )
}
const AssayId = ({ assayId, remove, append, resultCategoryGroupId, blocked }) => {
  const { formatMessage } = useIntl()
  const { data } = useAssayList()
  const { data: resultCategoryGroups } = useResultCategoryGroup(assayId, { enabled: !!assayId })

  if (!data) return null

  const del = { del: remove ? () => remove(['assayId', 'resultCategoryId', 'resultCategoryGroupId']) : undefined } // singleAssayId has no delete option

  const resultCategory = resultCategoryGroups?.filter(i => resultCategoryGroupId?.includes(i.externalId))

  return isArray(assayId) ? (
    assayId?.map(id => (
      <Btn
        key={id}
        del={
          blocked.includes('assayId')
            ? undefined
            : () => {
                if (assayId?.length > 1)
                  append({
                    assayId: pull(assayId, id),
                    resultCategoryGroupId: resultCategory.filter(i => i.assayId !== id).map(c => c.externalId),
                  })
                else del?.del()
              }
        }
        lbl={formatMessage(messages[data?.find(a => a.id === id)?.i18nKey])}
      />
    ))
  ) : assayId !== -1 ? (
    <Btn lbl={formatMessage(messages[data?.find(a => a.id === assayId)?.i18nKey])} {...del} />
  ) : null
}

const ResultCategoryId = ({ resultCategoryId, assayOverride, assayId, diseaseId, remove, blocked }) => {
  const { formatMessage } = useIntl()
  const { data: assays } = useAssayList()
  if (resultCategoryId && assays) {
    const rcName = assays
      .find(
        a =>
          (isArray(assayId) ? assayId.includes(a.id) : a.id === assayId) &&
          a.resultCategories.find(rc => rc.id === resultCategoryId)
      )
      .resultCategories.find(rc => rc.id === resultCategoryId).i18nKey
    // diseaseId here is used to fix filtering from HIV graph
    const rcdName = (
      (assays.find(i => i.diseaseId === diseaseId && i.hasResults) || { resultCategories: [] }).resultCategories.find(
        el => el.id === resultCategoryId
      ) || { i18nKey: '' }
    ).i18nKey
    const name = assayOverride ? `"${startCase(assayOverride)}"` : formatMessage(messages[assayId ? rcName : rcdName])

    const label = formatMessage(messages.withResultCategory, { resultCategoryName: name })

    return (
      <Btn lbl={label} del={blocked.includes('resultCategoryId') ? undefined : () => remove(['resultCategoryId'])} />
    )
  }
  return null
}

const ResultCategoryGroupId = ({ resultCategoryGroupId, assayId, assayOverride, remove, append, blocked }) => {
  const { formatMessage } = useIntl()

  const { data: resultCategoryGroups } = useResultCategoryGroup(assayId, { enabled: !!assayId })

  if (resultCategoryGroupId && resultCategoryGroups) {
    const msg = id =>
      assayOverride ? `"${startCase(assayOverride)}"` : resultCategoryGroups.find(it => it.externalId === id)?.name

    const del = {
      del: remove && !blocked.includes('resultCategoryGroupId') ? () => remove(['resultCategoryGroupId']) : undefined,
    }

    return isArray(resultCategoryGroupId) ? (
      resultCategoryGroupId.map(id => (
        <Btn
          del={
            blocked.includes('resultCategoryGroupId')
              ? undefined
              : () => {
                  if (resultCategoryGroupId.length > 1)
                    append({ resultCategoryGroupId: pull(resultCategoryGroupId, id) })
                  else del.del()
                }
          }
          lbl={formatMessage(messages.withResultCategoryGroup, { resultCategoryGroupName: msg(id) })}
        />
      ))
    ) : (
      <Btn
        lbl={formatMessage(messages.withResultCategoryGroup, { resultCategoryGroupName: msg(resultCategoryGroupId) })}
        {...del}
      />
    )
  }
  return null
}

const ConsumableId = ({ consumableId, remove, blocked }) => {
  const { formatMessage } = useIntl()
  const { data } = useConsumable()
  const item = data?.data?.find(a => a.id === consumableId)

  return item && consumableId ? (
    <Btn
      lbl={formatMessage(messages[item.i18nKey])}
      del={blocked.includes('consumableId') ? undefined : () => remove(['consumableId'])}
    />
  ) : null
}

const MinDate = ({ minDate, remove, blocked }) => {
  const { formatMessage, format } = useIntl()
  const { dateFormat } = getAspectDisplayPreferences().toJS()
  const del = remove && !blocked.includes('minDate') ? () => remove(['minDate']) : undefined

  const date = format(new Date(minDate), dateFormat)
  return <Btn lbl={formatMessage(messages.dateFrom, { date })} del={del} />
}

const MaxDate = ({ maxDate, remove, blocked }) => {
  const { formatMessage, format } = useIntl()
  const { dateFormat } = getAspectDisplayPreferences().toJS()
  if (!maxDate) return null

  const del = remove && !blocked.includes('maxDate') ? () => remove(['maxDate']) : undefined

  const date = format(new Date(maxDate), dateFormat)
  return <Btn lbl={formatMessage(messages.dateTo, { date })} del={del} />
}

const MinExpirationDate = ({ minExpirationDate, remove, blocked }) => {
  const { formatMessage, format } = useIntl()
  const { dateFormat } = getAspectDisplayPreferences().toJS()
  const date = format(new Date(minExpirationDate), dateFormat)

  return (
    <Btn
      lbl={formatMessage(messages.expDateFrom, { date })}
      del={blocked.includes('minExpirationDate') ? undefined : () => remove(['minExpirationDate'])}
    />
  )
}

const MaxExpirationDate = ({ maxExpirationDate, remove, blocked }) => {
  const { formatMessage, format } = useIntl()
  const { dateFormat } = getAspectDisplayPreferences().toJS()
  const date = format(new Date(maxExpirationDate), dateFormat)

  return (
    <Btn
      lbl={formatMessage(messages.expDateTo, { date })}
      del={blocked.includes('maxExpirationDate') ? undefined : () => remove(['maxExpirationDate'])}
    />
  )
}

const ReportName = ({ reportName, remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.whereReportNameIncludes, { reportName })}
      del={blocked.includes('reportName') ? undefined : () => remove(['reportName'])}
    />
  )
}

const ExternalId = ({ externalId, remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.whereExternalIdIncludes, { externalId })}
      del={blocked.includes('externalId') ? undefined : () => remove(['externalId'])}
    />
  )
}

const DeviceName = ({ deviceName, remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.whereDeviceNameIncludes, { deviceName })}
      del={blocked.includes('deviceName') ? undefined : () => remove(['deviceName'])}
    />
  )
}

const ContactStatus = ({ contactStatus, remove, blocked }) => {
  const { formatMessage } = useIntl()
  const status = formatMessage(commonDefinitions[`${contactStatus}` === '0' ? 'enabled' : 'disabled'])

  return (
    <Btn
      lbl={formatMessage(messages.contactEnabledStatus, { contactStatus: status })}
      del={blocked.includes('contactStatus') ? undefined : () => remove(['contactStatus'])}
    />
  )
}

const ContactNameOrEmail = ({ contactNameOrEmail, remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.whoseNameOrEmailIncludes, { contactNameOrEmail })}
      del={blocked.includes('contactNameOrEmail') ? undefined : () => remove(['contactNameOrEmail'])}
    />
  )
}

const NotificationName = ({ notificationName, remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.whereNotificationNameIncludes, { notificationName })}
      del={blocked.includes('notificationName') ? undefined : () => remove(['notificationName'])}
    />
  )
}

const OnlyTranfers = ({ remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.onlyTransfers)}
      del={blocked.includes('onlyTransfers') ? undefined : () => remove(['onlyTransfers'])}
    />
  )
}

const LotNumber = ({ lotNumber, remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.whereLotNumberIncludes, { lotNumber })}
      del={blocked.includes('lotNumber') ? undefined : () => remove(['lotNumber'])}
    />
  )
}

const HasStock = ({ remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.hasStock)}
      del={blocked.includes('hasStock') ? undefined : () => remove(['hasStock'])}
    />
  )
}

const DaysStockLeft = ({ daysStockLeft, remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages[daysStockLeft])}
      del={blocked.includes('daysStockLeft') ? undefined : () => remove(['daysStockLeft'])}
    />
  )
}

const BreakOutByLot = ({ remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.breakOutByLot)}
      del={blocked.includes('breakOutByLot') ? undefined : () => remove(['breakOutByLot'])}
    />
  )
}

const DeviceApprovalId = ({ deviceApprovalId, remove, blocked }) => {
  const { formatMessage } = useIntl()
  const { data } = useDeviceApprovalType()
  const name = data?.find(it => it.id === deviceApprovalId)?.name
  if (deviceApprovalId && name) {
    const deviceApprovalName = formatMessage(messages[`deviceApproval${name}`])
    return (
      <Btn
        lbl={formatMessage(messages.withDeviceApproval, { deviceApprovalName })}
        del={blocked.includes('deviceApprovalId') ? undefined : () => remove(['deviceApprovalId'])}
      />
    )
  }
  return null
}

const DeviceType = ({ deviceType, remove, blocked }) => {
  const { formatMessage } = useIntl()
  const { data } = useDeviceTypeList()

  if (data && deviceType) {
    const deviceTypeName = data.find(it => it.id === deviceType || it.externalId === deviceType)?.name

    return (
      <Btn
        lbl={formatMessage(messages.withDeviceType, { deviceTypeName })}
        del={blocked.includes('deviceType') ? undefined : () => remove(['deviceType', 'geneXpertType'])}
      />
    )
  }
  return null
}

const GeneXpertType = ({ geneXpertType, remove, blocked }) => {
  const { formatMessage } = useIntl()
  const label = cepheidModulesOptions.find(i => i.value === geneXpertType)?.label
  return (
    <Btn
      lbl={formatMessage(messages.withGeneXpertType, { geneXpertType: label })}
      del={blocked.includes('geneXpertType') ? undefined : () => remove(['geneXpertType'])}
    />
  )
}

const DeviceMaintenanceStatusId = ({ deviceMaintenanceStatusId, remove, blocked }) => {
  const { formatMessage } = useIntl()
  const ids = isArray(deviceMaintenanceStatusId) ? deviceMaintenanceStatusId : [deviceMaintenanceStatusId]
  return ids.map(id => (
    <Btn
      key={id}
      lbl={formatMessage(messages.withDeviceMaintenanceStatus, {
        deviceMaintenanceStatusName: formatMessage(messages[id]),
      })}
      del={
        blocked.includes('deviceMaintenanceStatusId') ? undefined : () => remove([`deviceMaintenanceStatusId.${id}`])
      }
    />
  ))
}

const ConnectorStatus = ({ connectorStatus, remove, blocked }) => {
  const { formatMessage } = useIntl()
  const status = formatMessage(messages[connectorStatus])
  return (
    <Btn
      lbl={formatMessage(messages.withConnectorStatus, { connectorStatus: status })}
      del={blocked.includes('connectorStatus') ? undefined : () => remove(['connectorStatus'])}
    />
  )
}

const ErrorCode = ({ errorCode, remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.errorCode, { errorCode })}
      del={blocked.includes('errorCode') ? undefined : () => remove(['errorCode'])}
    />
  )
}

const PatientOrResearchId = ({ patientOrResearchId, remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.patientOrResearchId, { patientOrResearchId })}
      del={blocked.includes('patientOrResearchId') ? undefined : () => remove(['patientOrResearchId'])}
    />
  )
}
const IssueTypeId = ({ issueTypeId, remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.issueTypeId, { issueTypeId })}
      del={blocked.includes('issueTypeId') ? undefined : () => remove(['issueTypeId'])}
    />
  )
}

const SampleId = ({ sampleId, remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.sampleId, { sampleId })}
      del={blocked.includes('sampleId') ? undefined : () => remove(['sampleId'])}
    />
  )
}

const ReportableSiteName = ({ reportableSiteName, reportableSiteId, remove, blocked }) => {
  const { formatMessage } = useIntl()
  const message = reportableSiteId ? messages.whereReportableSiteName : messages.whereReportableSiteNameIncludes
  return (
    <Btn
      lbl={formatMessage(message, { reportableSiteName })}
      del={
        blocked.includes('reportableSiteName') ? undefined : () => remove(['reportableSiteName', 'reportableSiteId'])
      }
    />
  )
}

const ReportableSiteId = ({ reportableSiteName, reportableSiteId, remove, blocked }) => {
  const { formatMessage } = useIntl()

  return !reportableSiteName ? (
    <Btn
      lbl={formatMessage(messages.whereReportableSiteIdIncludes, { reportableSiteId })}
      del={blocked.includes('reportableSiteId') ? undefined : () => remove(['reportableSiteId'])}
    />
  ) : null
}

const SampleOriginSiteId = ({ sampleOriginSite, remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.sampleOriginSite, { sampleOriginSiteName: sampleOriginSite })}
      del={blocked.includes('sampleOriginSite') ? undefined : () => remove(['sampleOriginSite'])}
    />
  )
}

const WorkflowStatusId = ({ workflowStatusId, remove, blocked }) => {
  const { formatMessage } = useIntl()
  const { data } = useWorkflowStatus()

  if (data) {
    const wfName = data.find(it => it.id === workflowStatusId).i18nKey

    return (
      <Btn
        lbl={formatMessage(messages.withWorkflowStatus, { workflowStatusName: formatMessage(messages[wfName]) })}
        del={blocked.includes('workflowStatusId') ? undefined : () => remove(['workflowStatusId'])}
      />
    )
  }
  return null
}

const TreatmentStatus = ({ treatmentStatus, remove, blocked }) => {
  const { formatMessage } = useIntl()
  const { data } = useTreatmentStatus()

  if (data) {
    const treatment = data.find(it => it.externalId === treatmentStatus).i18nKey

    return (
      <Btn
        lbl={formatMessage(messages.withTreatmentStatus, { treatmentStatusName: formatMessage(messages[treatment]) })}
        del={blocked.includes('treatmentStatus') ? undefined : () => remove(['treatmentStatus'])}
      />
    )
  }
  return null
}

const DisplayResult = ({ displayResult, remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.withDisplayResult, {
        displayResult: formatMessage(
          messages[`display${displayResult?.charAt(0).toUpperCase() + displayResult?.slice(1)}Results`]
        ),
      })}
      del={blocked.includes('displayResult') ? undefined : () => remove(['displayResult'])}
    />
  )
}

const OnlyReportableResults = ({ remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.onlyReportableResults)}
      del={blocked.includes('onlyReportableResults') ? undefined : () => remove(['onlyReportableResults'])}
    />
  )
}

const OnlyDownloadedByReporter = ({ remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.onlyDownloadedByReporter)}
      del={blocked.includes('onlyDownloadedByReporter') ? undefined : () => remove(['onlyDownloadedByReporter'])}
    />
  )
}

const OnlyTreatmentRequired = ({ remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.onlyTreatmentRequired)}
      del={blocked.includes('onlyTreatmentRequired') ? undefined : () => remove(['onlyTreatmentRequired'])}
    />
  )
}
const OnlyUnreconciled = ({ remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.onlyUnreconciled)}
      del={blocked.includes('onlyUnreconciled') ? undefined : () => remove(['onlyUnreconciled'])}
    />
  )
}

const ShowDecommissionedDevices = ({ remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.showDecommissionedDevices)}
      del={blocked.includes('showDecommissionedDevices') ? undefined : () => remove(['showDecommissionedDevices'])}
    />
  )
}

const OnlyErrors = ({ remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.onlyErrors)}
      del={blocked.includes('onlyErrors') ? undefined : () => remove(['onlyErrors'])}
    />
  )
}

const ReportWithName = ({ remove, reportWithName, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.reportWithName, { reportWithName })}
      del={blocked.includes('reportWithName') ? undefined : () => remove(['reportWithName'])}
    />
  )
}

const PatientId = ({ patientId, remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.patientId, { patientId })}
      del={blocked.includes('patientId') ? undefined : () => remove(['patientId'])}
    />
  )
}

const NotificationCategory = ({ notificationCategory, remove, blocked }) => {
  const { formatMessage } = useIntl()
  const name = notificationCategories.find(i => i.id === notificationCategory)?.i18Name
  if (name)
    return (
      <Btn
        lbl={formatMessage(messages.notificationCategoryType, {
          notificationCategoryType: formatMessage(name),
        })}
        del={blocked.includes('notificationCategory') ? undefined : () => remove(['notificationCategory'])}
      />
    )
  return null
}

const NotificationType = ({ notificationTypeCategoryId, notificationTypeId, remove, blocked }) => {
  const { formatMessage } = useIntl()
  const { data } = useNotificationType(notificationTypeCategoryId)
  if (data && notificationTypeId) {
    const name = data.find(i => i.id === notificationTypeId)?.name
    return (
      <Btn
        lbl={formatMessage(messages.notificationType, { notificationType: name })}
        del={blocked.includes('notificationTypeId') ? undefined : () => remove(['notificationTypeId'])}
      />
    )
  }
  return null
}

const Revoked = ({ revoked, remove, blocked }) => {
  const { formatMessage } = useIntl()

  return (
    <Btn
      lbl={formatMessage(messages.withRevoked, { revokedStatus: revoked === '0' ? 'false' : 'true' })}
      del={blocked.includes('revoked') ? undefined : () => remove(['revoked'])}
    />
  )
}

export default FilterButtons
