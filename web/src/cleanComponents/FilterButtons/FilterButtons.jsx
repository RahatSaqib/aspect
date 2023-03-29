import React from 'react'
import { Button } from '@mui/material'
import Immutable from 'immutable'
import startCase from 'lodash/startCase'
import { MdClose } from 'react-icons/md'
// import { useSelector } from 'react-redux'
import useAssayList from '../../hooks/assay/useAssayList'
import useResultCategoryGroup from '../../hooks/device/useResultCategoryGroup'
import useLgaByState from '../../hooks/geography/useLgaByState'
import useStatesByCountry from '../../hooks/geography/useStatesByCountry'
import useConsumable from '../../hooks/inventory/useConsumable'
import useI18n from '../../hooks/useI18n'
// import { commonDefinitions } from '../../messages/customMessages'
import { getAspectDisplayPreferences } from '../../utils/LocalStorage'
import messages from './messages'

// const EMPTY_CONTEXT = null
// const EMPTY_MAP = Immutable.Map()

// const revokedOptions = [
//   { id: '0', name: 'false' },
//   { id: '1', name: 'true' },
// ]
// // see values for names in `./messages.js`
// const displayResultOptions = [
//   { id: 'all', name: 'displayAllResults' },
//   { id: 'actual', name: 'displayActualResults' },
//   { id: 'excluded', name: 'displayExcludedResults' },
// ]

// const getResultCategoryNameFromDisease = (assayItems, filterDiseaseId, resultCategoryId) => {
//   const assayIds = isArray(filterDiseaseId) ? filterDiseaseId : [filterDiseaseId]
//   const assaysMatchingDisease = assayItems.toJS().filter(i => assayIds.includes(i.diseaseId) && i.hasResults)
//   const matchingCategory = assaysMatchingDisease.length
//     ? assaysMatchingDisease[0].resultCategories.find(el => el.id === resultCategoryId)
//     : { i18nKey: '' }
//   return matchingCategory.i18nKey
// }

// const getResultCategoryName = (assayItems, filterAssayId, resultCategoryId) => {
//   //
//   const assayIds = isArray(filterAssayId) ? filterAssayId : [filterAssayId]
//   return assayItems
//     .find(it => assayIds.includes(it.get('id')), EMPTY_CONTEXT, EMPTY_MAP)
//     .get('resultCategories', EMPTY_MAP)
//     .find(it => it.get('id') === resultCategoryId, EMPTY_CONTEXT, EMPTY_MAP)
//     .get('i18nKey', '')
// }

// const FiltersBtnGroup = ({ children, ...restProps }) => {
//   const { formatMessage, format } = useI18n()
//   const { dateFormat } = getAspectDisplayPreferences().toJS()

//   const { data: deviceTypes } = useDeviceTypeList()

//   const buttonBy = {
//     diseaseId: makeButton((diseaseId, { diseaseItems }) =>
//       diseaseItems.find(it => it.get('id') === diseaseId, EMPTY_CONTEXT, EMPTY_MAP).get('name')
//     ),
//     minExpirationDate: makeButton(date =>
//       formatMessage(messages.expDateFrom, {
//         date: format(new Date(date), dateFormat),
//       })
//     ),
//     maxExpirationDate: makeButton(date =>
//       formatMessage(messages.expDateTo, {
//         date: format(new Date(date), dateFormat),
//       })
//     ),
//     partnerId: makeButton((partnerId, { partnerItems }) =>
//       formatMessage(messages.partnerId, {
//         partnerName: partnerItems.find(it => it.get('id') === partnerId, EMPTY_CONTEXT, EMPTY_MAP).get('name'),
//       })
//     ),
//     patientOrResearchId: makeButton(patientOrResearchId =>
//       formatMessage(messages.patientOrResearchId, { patientOrResearchId })
//     ),
//     patientOrCaseId: makeButton(patientOrCaseId => formatMessage(messages.patientOrCaseId, { patientOrCaseId })),
//     sampleId: makeButton(sampleId => formatMessage(messages.sampleId, { sampleId })),
//     deviceName: makeButton(deviceName =>
//       formatMessage(messages.whereDeviceNameIncludes, {
//         deviceName,
//       })
//     ),
//     siteId: makeButton(siteId =>
//       formatMessage(messages.whereSiteIdIncludes, {
//         siteId,
//       })
//     ),
//     resultCategory2Id: makeButton((resultCategory2Id, { filters, assayItems }) =>
//       formatMessage(messages.withResultCategory, {
//         resultCategoryName: formatMessage(
//           messages[getResultCategoryName(assayItems, filters.assayId, resultCategory2Id)]
//         ),
//       })
//     ),
//     errorCode: makeButton(errorCode => formatMessage(messages.errorCode, { errorCode })),
//     reportableSiteName: makeButton((reportableSiteName, { filters }) => {
//       const message = filters.reportableSiteId
//         ? messages.whereReportableSiteName
//         : messages.whereReportableSiteNameIncludes
//       return formatMessage(message, { reportableSiteName })
//     }),
//     reportableSiteId: (filterKey, props) => {
//       /**
//        * if filters.reportableSiteName is defined then skip processing of filters.reportableSiteId
//        * because this value will be used when showing button for filters.reportableSiteName
//        */
//       if (props.filters.reportableSiteName) {
//         return null
//       }
//       /**
//        * if filters.reportableSiteName is missing then treat filters.reportableSiteId
//        * as separate (visible) filter button
//        */
//       return makeButton(reportableSiteId =>
//         formatMessage(messages.whereReportableSiteIdIncludes, {
//           reportableSiteId,
//         })(filterKey, props)
//       )
//     },
//     // eslint-disable-next-line no-empty-pattern
//     sampleOriginSite: makeButton((sampleOriginSiteId, {}) =>
//       formatMessage(messages.sampleOriginSite, {
//         sampleOriginSiteName: sampleOriginSiteId,
//       })
//     ),
//     contactNameOrEmail: makeButton(contactNameOrEmail =>
//       formatMessage(messages.whoseNameOrEmailIncludes, {
//         contactNameOrEmail,
//       })
//     ),
//     workflowStatusId: makeButton((workflowStatusId, { workflowStatusItems }) =>
//       formatMessage(messages.withWorkflowStatus, {
//         workflowStatusName: formatMessage(
//           messages[
//             workflowStatusItems.find(it => it.get('id') === workflowStatusId, EMPTY_CONTEXT, EMPTY_MAP).get('i18nKey')
//           ]
//         ),
//       })
//     ),
//     treatmentStatus: makeButton((treatmentStatus, { treatmentStatusItems }) =>
//       formatMessage(messages.withTreatmentStatus, {
//         treatmentStatusName: formatMessage(
//           messages[
//             treatmentStatusItems
//               .find(it => it.get('externalId') === treatmentStatus, EMPTY_CONTEXT, EMPTY_MAP)
//               .get('i18nKey')
//           ]
//         ),
//       })
//     ),
//     deviceApprovalId: makeButton((deviceApprovalId, { deviceApprovalItems }) =>
//       formatMessage(messages.withDeviceApproval, {
//         deviceApprovalName: formatMessage(
//           messages[
//             `deviceApproval${deviceApprovalItems
//               .find(it => it.get('id') === deviceApprovalId, EMPTY_CONTEXT, EMPTY_MAP)
//               .get('name')}`
//           ]
//         ),
//       })
//     ),
//     deviceMaintenanceStatusId: (filterKey, props) => {
//       const {
//         filters: { deviceMaintenanceStatusId },
//       } = props
//       const deviceMaintenanceStatusIds = isArray(deviceMaintenanceStatusId)
//         ? deviceMaintenanceStatusId
//         : [deviceMaintenanceStatusId]

//       return deviceMaintenanceStatusIds.map((deviceMaintenanceStatusId, index) =>
//         makeButton(() =>
//           formatMessage(messages.withDeviceMaintenanceStatus, {
//             deviceMaintenanceStatusName: formatMessage(messages[deviceMaintenanceStatusId]),
//           })
//         )(filterKey, props, index)
//       )
//     },
//     deviceTypeId: makeButton(deviceTypeId =>
//       formatMessage(messages.withDeviceType, {
//         deviceTypeName: deviceTypes?.find(it => it.id === deviceTypeId, EMPTY_CONTEXT, EMPTY_MAP)?.name,
//       })
//     ),
//     deviceType: makeButton(deviceType =>
//       formatMessage(messages.withDeviceType, {
//         deviceTypeName: deviceTypes?.find(it => it.externalId === deviceType, EMPTY_CONTEXT, EMPTY_MAP)?.name,
//       })
//     ),
//     displayResult: makeButton(displayResult =>
//       formatMessage(messages.withDisplayResult, {
//         displayResult: formatMessage(
//           messages[displayResultOptions.find(it => it.id === displayResult, EMPTY_CONTEXT, EMPTY_MAP).name]
//         ),
//       })
//     ),
//     externalId: makeButton(externalId =>
//       formatMessage(messages.whereExternalIdIncludes, {
//         externalId,
//       })
//     ),
//     notificationName: makeButton(notificationName =>
//       formatMessage(messages.whereNotificationNameIncludes, {
//         notificationName,
//       })
//     ),
//     revoked: makeButton(revoked =>
//       formatMessage(messages.withRevoked, {
//         revokedStatus: revokedOptions.find(it => it.id === revoked, EMPTY_CONTEXT, EMPTY_MAP).name,
//       })
//     ),
//     // Special keys
//     deviceIds: makeButton(deviceIds =>
//       formatMessage(messages.whereDeviceIdIsIn, {
//         joinedIds: deviceIds,
//       })
//     ),
//     siteIds: makeButton(siteIds =>
//       formatMessage(messages.whereSiteIdIsIn, {
//         joinedIds: siteIds,
//       })
//     ),
//     onlyReportableResults: makeButton(() => formatMessage(messages.onlyReportableResults)),
//     onlyDownloadedByReporter: makeButton(() => formatMessage(messages.onlyDownloadedByReporter)),
//     onlyEverTransferred: makeButton(() => formatMessage(messages.onlyEverTransferred)),
//     onlyTreatmentRequired: makeButton(() => formatMessage(messages.onlyTreatmentRequired)),
//     onlyTransfers: makeButton(() => formatMessage(messages.onlyTransfers)),
//     issueTypeId: makeButton(issueTypeId =>
//       formatMessage(messages.deviceIssueType, {
//         issueTypeId: startCase(issueTypeId),
//       })
//     ),
//     daysStockLeft: makeButton(daysStockLeft => formatMessage(messages[daysStockLeft])),
//     hasStock: makeButton(() => formatMessage(messages.hasStock)),
//     lotNumber: makeButton(lotNumber =>
//       formatMessage(messages.whereLotNumberIncludes, {
//         lotNumber,
//       })
//     ),
//     contactStatus: makeButton(status =>
//       formatMessage(messages.contactEnabledStatus, {
//         contactStatus:
//           status === '0' ? formatMessage(commonDefinitions.enabled) : formatMessage(commonDefinitions.disabled),
//       })
//     ),
//     connectorStatus: makeButton(connectorStatus =>
//       formatMessage(messages.withConnectorStatus, {
//         connectorStatus: formatMessage(messages[connectorStatus]),
//       })
//     ),
//   }
//   return (
//     <div>
//       {children}
//       {Immutable.Map(restProps.filters)
//         .keySeq()
//         .sortBy(filterKey => filtersOrdering[filterKey])
//         .map(filterKey => buttonBy[filterKey](filterKey, restProps))}
//     </div>
//   )
// }

// export const Viejo = connect(
//   state => ({
//     siteItemsById: state.site.selectList.items,
//     countryItems: state.geography.countriesForLocationSelector.items,
//     countries: state.geography.countriesForLocationSelector,
//     consumableItems: state.consumable.consumables.items,
//     assayItems: state.assay.items,
//     resultCategoryGroupItems: state.resultCategoryGroup.items,
//     partnerItems: state.jobs.partnersAndJobFunctionsForSelectList.partners,
//     workflowStatusItems: state.resultWorkflowStatus.items,
//     treatmentStatusItems: state.resultTreatmentStatus.items,
//     deviceApprovalItems: state.deviceApproval.items,
//     deviceTypeItems: state.deviceType.selectList.items,
//     diseaseItems: state.disease.diseases.items,
//     deviceMaintenanceStatusItems: state.deviceMaintenanceStatus.items,
//   }),
//   null
// )(FiltersBtnGroup)

const filtersOrdering = {
  assayId: 4,
  diseaseId: 3,
  countryId: 1,
  stateId: 2,
  lgaId: 3,
  minDate: 18,
  maxDate: 19,
  minExpirationDate: 40,
  maxExpirationDate: 41,
  partnerId: 8,
  patientOrResearchId: 10,
  sampleId: 9,
  errorCode: 6,
  deviceName: 11,
  resultCategoryId: 5,
  resultCategory2Id: 6,
  siteName: 12,
  reportableSiteName: 33,
  reportableSiteId: 33,
  sampleOriginSite: 13,
  contactNameOrEmail: 14,
  contactStatus: 15,
  consumableId: 7,
  workflowStatusId: 16,
  deviceApprovalId: 17,
  externalId: 15,
  notificationName: 20,
  revoked: 21,
  treatmentStatus: 22,
  siteId: 23,
  // -1: Special orderings
  siteIds: -1,
  patientOrCaseId: 23,
  onlyReportableResults: 23,
  onlyTreatmentRequired: 33,
  onlyDownloadedByReporter: 35,
  onlyTransfers: 36,
  onlyEverTransferred: 34,
  issueTypeId: 24,
  daysStockLeft: 31,
  reportName: 32,
  lotNumber: 33,
  hasStock: 34,
}

// All starts here
const FilterButtons = ({ filters, remove }) => {
  return (
    <span>
      {Immutable.Map(filters)
        .keySeq()
        .sortBy(filterKey => filtersOrdering[filterKey])
        .map(filterKey => buttonMapping[filterKey]({ ...filters, remove }))}
    </span>
  )
}
export default FilterButtons

const buttonMapping = {
  countryId: () => null, // we hide intentionally the country
  stateId: ({ countryId, stateId, remove }) => <StateId countryId={countryId} stateId={stateId} remove={remove} />,
  lgaId: ({ stateId, lgaId, remove }) => <LgaId stateId={stateId} lgaId={lgaId} remove={remove} />,
  siteName: ({ siteName, remove }) => <SiteName siteName={siteName} remove={remove} />,
  assayId: ({ assayId }) => <AssayId assayId={assayId} />, // should receive an array of assayIds
  resultCategoryId: ({ resultCategoryId, assayOverride, assayId, diseaseId, remove }) => (
    <ResultCategoryId
      resultCategoryId={resultCategoryId}
      assayOverride={assayOverride}
      assayId={assayId}
      diseaseId={diseaseId}
      remove={remove}
    />
  ),
  resultCategoryGroupId: ({ resultCategoryGroupId, assayOverride, remove }) => (
    <ResultCategoryGroupId
      resultCategoryGroupId={resultCategoryGroupId}
      assayOverride={assayOverride}
      remove={remove}
    />
  ),
  consumableId: ({ consumableId, remove }) => <ConsumableId consumableId={consumableId} remove={remove} />,
  minDate: ({ minDate, remove }) => <MinDate minDate={minDate} remove={remove} />,
  maxDate: ({ maxDate, remove }) => <MaxDate maxDate={maxDate} remove={remove} />,
  reportName: ({ reportName, remove }) => <ReportName reportName={reportName} remove={remove} />,
  //
  assayOverride: () => null,
  singleAssayId: ({ assayId }) => <SingleAssayId assayId={assayId} />, // only one permanent
}

const StateId = ({ countryId, stateId, remove }) => {
  const { data } = useStatesByCountry(countryId)

  return data ? <Btn lbl={data.find(s => s.id === stateId).name} del={() => remove(stateId)} /> : null
}

const LgaId = ({ stateId, lgaId, remove }) => {
  const { data } = useLgaByState(stateId)

  return data ? <Btn lbl={data.find(s => s.id === lgaId).name} del={() => remove(lgaId)} /> : null
}

const SiteName = ({ siteName, remove }) => {
  const { formatMessage } = useI18n()

  return <Btn lbl={formatMessage(messages.whereSiteNameIncludes, { siteName })} del={() => remove(siteName)} />
}

const AssayId = ({ assayId, remove }) => {
  const { formatMessage } = useI18n()
  const { data } = useAssayList()

  return data ? (
    <Btn lbl={formatMessage(messages[data.find(a => a.id === assayId).i18nKey])} del={() => remove(assayId)} />
  ) : null
}

const ResultCategoryId = ({ resultCategoryId, assayOverride, assayId, diseaseId, remove }) => {
  const { formatMessage } = useI18n()
  const { data: assays } = useAssayList()
  if (resultCategoryId && assays) {
    const rcName = assays.find(a => a.id === assayId).resultCategories.find(rc => rc.id === resultCategoryId).i18nKey
    // diseaseId here is used to fix filtering from HIV graph
    const rcdName = (
      (assays.find(i => i.diseaseId === diseaseId && i.hasResults) || { resultCategories: [] }).resultCategories.find(
        el => el.id === resultCategoryId
      ) || { i18nKey: '' }
    ).i18nKey
    const name = assayOverride ? `"${startCase(assayOverride)}"` : formatMessage(messages[assayId ? rcName : rcdName])

    const label = formatMessage(messages.withResultCategory, { resultCategoryName: name })

    return <Btn lbl={label} del={() => remove(resultCategoryId)} />
  }
  return null
}

const ResultCategoryGroupId = ({ resultCategoryGroupId, assayOverride, remove }) => {
  const { formatMessage } = useI18n()
  const { data: resultCategoryGroups } = useResultCategoryGroup()
  if (resultCategoryGroupId && resultCategoryGroups) {
    const message = messages[resultCategoryGroups.find(it => it.externalId === resultCategoryGroupId).i18nKey]

    const msg = assayOverride ? `"${startCase(assayOverride)}"` : message

    return assayOverride && msg ? (
      <Btn
        lbl={formatMessage(messages.withResultCategoryGroup, { resultCategoryGroupName: msg })}
        del={() => remove(resultCategoryGroupId)}
      />
    ) : null
  }
  return null
}

const ConsumableId = ({ consumableId, remove }) => {
  const { formatMessage } = useI18n()
  const { data } = useConsumable()

  return data ? (
    <Btn
      lbl={formatMessage(messages[data.find(a => a.id === consumableId).i18nKey])}
      del={() => remove(consumableId)}
    />
  ) : null
}

const MinDate = ({ minDate, remove }) => {
  const { formatMessage, format } = useI18n()
  const { dateFormat } = getAspectDisplayPreferences().toJS()
  const date = format(new Date(minDate), dateFormat)

  return <Btn lbl={formatMessage(messages.dateFrom, { date })} del={() => remove(minDate)} />
}

const MaxDate = ({ maxDate, remove }) => {
  const { formatMessage, format } = useI18n()
  const { dateFormat } = getAspectDisplayPreferences().toJS()
  const date = format(new Date(maxDate), dateFormat)

  return <Btn lbl={formatMessage(messages.dateTo, { date })} del={() => remove(maxDate)} />
}

const ReportName = ({ reportName, remove }) => {
  const { formatMessage } = useI18n()

  return <Btn lbl={formatMessage(messages.whereReportNameIncludes, { reportName })} del={() => remove(reportName)} />
}

const SingleAssayId = ({ assayId }) => {
  const { formatMessage } = useI18n()
  const { data } = useAssayList()

  return data ? <Btn lbl={formatMessage(messages[data.find(a => a.id === assayId)].i18nKey)} /> : null
}

const Btn = ({ lbl, del }) => (
  <Button color="secondary" variant="contained" onClick={del} sx={{ m: '2px' }}>
    {lbl}
    {del ? <MdClose style={{ marginLeft: '5px' }} /> : null}
  </Button>
)
