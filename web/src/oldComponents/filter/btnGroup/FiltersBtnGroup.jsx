import React from 'react'
import { Button } from '@mui/material'
import classnames from 'classnames/bind'
import Immutable from 'immutable'
import isArray from 'lodash/isArray'
import startCase from 'lodash/startCase'
import { MdClose } from 'react-icons/md'
import { connect } from 'react-redux'
import { compose, pure } from 'recompose'
import useI18n from '../../../hooks/useI18n'
import { commonDefinitions } from '../../../messages/customMessages'
import { getAspectDisplayPreferences } from '../../../utils/LocalStorage'
import { isCountryFilterHidden } from '../utils'
import messages from './messages'
import styles from './styles.css'

const cssClasses = classnames.bind(styles)

const EMPTY_CONTEXT = null
const EMPTY_MAP = Immutable.Map()

const revokedOptions = [
  { id: '0', name: 'false' },
  { id: '1', name: 'true' },
]
// see values for names in `./messages.js`
const displayResultOptions = [
  { id: 'all', name: 'displayAllResults' },
  { id: 'actual', name: 'displayActualResults' },
  { id: 'excluded', name: 'displayExcludedResults' },
]

const enhance = compose(
  pure,
  connect(
    state => ({
      siteItemsById: state.site.selectList.items,
      countryItems: state.geography.countriesForLocationSelector.items,
      countries: state.geography.countriesForLocationSelector,
      consumableItems: state.consumable.consumables.items,
      assayItems: state.assay.items,
      resultCategoryGroupItems: state.resultCategoryGroup.items,
      partnerItems: state.jobs.partnersAndJobFunctionsForSelectList.partners,
      workflowStatusItems: state.resultWorkflowStatus.items,
      treatmentStatusItems: state.resultTreatmentStatus.items,
      deviceApprovalItems: state.deviceApproval.items,
      deviceTypeItems: state.deviceType.selectList.items,
      diseaseItems: state.disease.diseases.items,
      deviceMaintenanceStatusItems: state.deviceMaintenanceStatus.items,
    }),
    null
  )
)

const filtersOrdering = {
  // Manually keep this in sync with the components ordering in FiltersPanel
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

const makeButton = labelFn => (filterKey, props, index) => {
  let filterValue = props.filters[filterKey]
  if (isArray(filterValue)) {
    filterValue = filterValue[index || 0]
  }
  return (
    <Button
      key={`${filterKey}-${index || ''}`}
      className={cssClasses('Button')}
      color="secondary"
      variant="contained"
      onClick={() => (props.permanent ? null : props.onRemoveFilterItem(filterKey, index))}
    >
      {labelFn(filterValue, props)}
      {props.permanent ? null : <MdClose className={cssClasses('Button__icon')} />}
    </Button>
  )
}

const getResultCategoryName = (assayItems, filterAssayId, resultCategoryId) => {
  const assayIds = isArray(filterAssayId) ? filterAssayId : [filterAssayId]
  return assayItems
    .find(it => assayIds.includes(it.get('id')), EMPTY_CONTEXT, EMPTY_MAP)
    .get('resultCategories', EMPTY_MAP)
    .find(it => it.get('id') === resultCategoryId, EMPTY_CONTEXT, EMPTY_MAP)
    .get('i18nKey', '')
}

const getResultCategoryNameFromDisease = (assayItems, filterDiseaseId, resultCategoryId) => {
  const assayIds = isArray(filterDiseaseId) ? filterDiseaseId : [filterDiseaseId]
  const assaysMatchingDisease = assayItems.toJS().filter(i => assayIds.includes(i.diseaseId) && i.hasResults)
  const matchingCategory = assaysMatchingDisease.length
    ? assaysMatchingDisease[0].resultCategories.find(el => el.id === resultCategoryId)
    : { i18nKey: '' }
  return matchingCategory.i18nKey
}

const FiltersBtnGroup = ({ children, ...restProps }) => {
  const { formatMessage, format } = useI18n()
  const { dateFormat } = getAspectDisplayPreferences().toJS()

  const buttonBy = {
    singleAssayId: (filterKey, props) => {
      const {
        assayItems,
        filters: { assayId },
      } = props
      const assayIds = isArray(assayId) ? assayId : [assayId]
      return assayIds.map((__, index) =>
        makeButton(value =>
          formatMessage(
            messages[assayItems.find(it => it.get('id') === value, EMPTY_CONTEXT, EMPTY_MAP).get('i18nKey')]
          )
        )(filterKey, { ...props, permanent: true }, index)
      )
    },
    assayId: (filterKey, props) => {
      const {
        assayItems,
        filters: { assayId },
      } = props
      const assayIds = isArray(assayId) ? assayId : [assayId]
      return assayIds.map((__, index) =>
        makeButton(value =>
          formatMessage(
            messages[assayItems.find(it => it.get('id') === value, EMPTY_CONTEXT, EMPTY_MAP).get('i18nKey')]
          )
        )(filterKey, props, index)
      )
    },
    diseaseId: makeButton((diseaseId, { diseaseItems }) =>
      diseaseItems.find(it => it.get('id') === diseaseId, EMPTY_CONTEXT, EMPTY_MAP).get('name')
    ),
    countryId: (filterKey, props) => {
      const { countries } = props
      /**
       * do NOT show filter button if Country filter is hidden because only
       * 1 country is allowed/displayed/accessible for user
       */
      if (isCountryFilterHidden(countries)) {
        return null
      }
      // show button for selected Country
      return makeButton((countryId, { countryItems }) =>
        countryItems.find(it => it.id === countryId, EMPTY_CONTEXT, EMPTY_MAP).get('name')
      )(filterKey, props)
    },
    stateId: makeButton((stateId, { countryItems, filters }) =>
      countryItems
        .find(it => it.id === filters.countryId, EMPTY_CONTEXT, EMPTY_MAP)
        .getIn(['children', 'items'], EMPTY_MAP)
        .find(it => it.id === stateId, EMPTY_CONTEXT, EMPTY_MAP)
        .get('name')
    ),
    lgaId: makeButton((lgaId, { countryItems, filters }) =>
      countryItems
        .find(it => it.id === filters.countryId, EMPTY_CONTEXT, EMPTY_MAP)
        .getIn(['children', 'items'], EMPTY_MAP)
        .find(it => it.id === filters.stateId, EMPTY_CONTEXT, EMPTY_MAP)
        .getIn(['children', 'items'], EMPTY_MAP)
        .find(it => it.id === lgaId, EMPTY_CONTEXT, EMPTY_MAP)
        .get('name')
    ),
    minDate: makeButton(date =>
      formatMessage(messages.dateFrom, {
        date: format(new Date(date), dateFormat),
      })
    ),
    maxDate: makeButton(date =>
      formatMessage(messages.dateTo, {
        date: format(new Date(date), dateFormat),
      })
    ),
    minExpirationDate: makeButton(date =>
      formatMessage(messages.expDateFrom, {
        date: format(new Date(date), dateFormat),
      })
    ),
    maxExpirationDate: makeButton(date =>
      formatMessage(messages.expDateTo, {
        date: format(new Date(date), dateFormat),
      })
    ),
    partnerId: makeButton((partnerId, { partnerItems }) =>
      formatMessage(messages.partnerId, {
        partnerName: partnerItems.find(it => it.get('id') === partnerId, EMPTY_CONTEXT, EMPTY_MAP).get('name'),
      })
    ),
    patientOrResearchId: makeButton(patientOrResearchId =>
      formatMessage(messages.patientOrResearchId, { patientOrResearchId })
    ),
    patientOrCaseId: makeButton(patientOrCaseId => formatMessage(messages.patientOrCaseId, { patientOrCaseId })),
    sampleId: makeButton(sampleId => formatMessage(messages.sampleId, { sampleId })),
    deviceName: makeButton(deviceName =>
      formatMessage(messages.whereDeviceNameIncludes, {
        deviceName,
      })
    ),
    siteId: makeButton(siteId =>
      formatMessage(messages.whereSiteIdIncludes, {
        siteId,
      })
    ),
    resultCategoryId: makeButton((resultCategoryId, { filters, assayItems }) =>
      formatMessage(
        messages.withResultCategory,
        filters.assayOverride
          ? {
              resultCategoryName: `"${startCase(filters.assayOverride)}"`,
            }
          : {
              resultCategoryName: formatMessage(
                // diseaseId here is used to fix filtering from HIV graph
                messages[
                  filters.assayId
                    ? getResultCategoryName(assayItems, filters.assayId, resultCategoryId)
                    : getResultCategoryNameFromDisease(assayItems, filters.diseaseId, resultCategoryId)
                ]
              ),
            }
      )
    ),
    resultCategory2Id: makeButton((resultCategory2Id, { filters, assayItems }) =>
      formatMessage(messages.withResultCategory, {
        resultCategoryName: formatMessage(
          messages[getResultCategoryName(assayItems, filters.assayId, resultCategory2Id)]
        ),
      })
    ),
    resultCategoryGroupId: makeButton((resultCategoryGroupId, { filters, resultCategoryGroupItems }) => {
      return formatMessage(
        messages.withResultCategoryGroup,
        filters.assayOverride
          ? {
              resultCategoryGroupName: `"${startCase(filters.assayOverride)}"`,
            }
          : {
              resultCategoryGroupName: formatMessage(
                messages[
                  resultCategoryGroupItems
                    .find(it => it.get('externalId') === resultCategoryGroupId, EMPTY_CONTEXT, EMPTY_MAP)
                    .get('i18nKey')
                ]
              ),
            }
      )
    }),
    errorCode: makeButton(errorCode => formatMessage(messages.errorCode, { errorCode })),
    siteName: makeButton(siteName =>
      formatMessage(messages.whereSiteNameIncludes, {
        siteName,
      })
    ),
    reportableSiteName: makeButton((reportableSiteName, { filters }) => {
      const message = filters.reportableSiteId
        ? messages.whereReportableSiteName
        : messages.whereReportableSiteNameIncludes
      return formatMessage(message, { reportableSiteName })
    }),
    reportableSiteId: (filterKey, props) => {
      /**
       * if filters.reportableSiteName is defined then skip processing of filters.reportableSiteId
       * because this value will be used when showing button for filters.reportableSiteName
       */
      if (props.filters.reportableSiteName) {
        return null
      }
      /**
       * if filters.reportableSiteName is missing then treat filters.reportableSiteId
       * as separate (visible) filter button
       */
      return makeButton(reportableSiteId =>
        formatMessage(messages.whereReportableSiteIdIncludes, {
          reportableSiteId,
        })(filterKey, props)
      )
    },
    // eslint-disable-next-line no-empty-pattern
    sampleOriginSite: makeButton((sampleOriginSiteId, {}) =>
      formatMessage(messages.sampleOriginSite, {
        sampleOriginSiteName: sampleOriginSiteId,
      })
    ),
    contactNameOrEmail: makeButton(contactNameOrEmail =>
      formatMessage(messages.whoseNameOrEmailIncludes, {
        contactNameOrEmail,
      })
    ),
    consumableId: makeButton((consumableId, { consumableItems }) =>
      formatMessage(
        messages[consumableItems.find(it => it.get('id') === consumableId, EMPTY_CONTEXT, EMPTY_MAP).get('i18nKey')]
      )
    ),
    workflowStatusId: makeButton((workflowStatusId, { workflowStatusItems }) =>
      formatMessage(messages.withWorkflowStatus, {
        workflowStatusName: formatMessage(
          messages[
            workflowStatusItems.find(it => it.get('id') === workflowStatusId, EMPTY_CONTEXT, EMPTY_MAP).get('i18nKey')
          ]
        ),
      })
    ),
    treatmentStatus: makeButton((treatmentStatus, { treatmentStatusItems }) =>
      formatMessage(messages.withTreatmentStatus, {
        treatmentStatusName: formatMessage(
          messages[
            treatmentStatusItems
              .find(it => it.get('externalId') === treatmentStatus, EMPTY_CONTEXT, EMPTY_MAP)
              .get('i18nKey')
          ]
        ),
      })
    ),
    deviceApprovalId: makeButton((deviceApprovalId, { deviceApprovalItems }) =>
      formatMessage(messages.withDeviceApproval, {
        deviceApprovalName: formatMessage(
          messages[
            `deviceApproval${deviceApprovalItems
              .find(it => it.get('id') === deviceApprovalId, EMPTY_CONTEXT, EMPTY_MAP)
              .get('name')}`
          ]
        ),
      })
    ),
    deviceMaintenanceStatusId: (filterKey, props) => {
      const {
        filters: { deviceMaintenanceStatusId },
      } = props
      const deviceMaintenanceStatusIds = isArray(deviceMaintenanceStatusId)
        ? deviceMaintenanceStatusId
        : [deviceMaintenanceStatusId]

      return deviceMaintenanceStatusIds.map((deviceMaintenanceStatusId, index) =>
        makeButton(() =>
          formatMessage(messages.withDeviceMaintenanceStatus, {
            deviceMaintenanceStatusName: formatMessage(messages[deviceMaintenanceStatusId]),
          })
        )(filterKey, props, index)
      )
    },
    deviceTypeId: makeButton((deviceTypeId, { deviceTypeItems }) =>
      formatMessage(messages.withDeviceType, {
        deviceTypeName: deviceTypeItems.find(it => it.get('id') === deviceTypeId, EMPTY_CONTEXT, EMPTY_MAP).get('name'),
      })
    ),
    deviceType: makeButton((deviceType, { deviceTypeItems }) =>
      formatMessage(messages.withDeviceType, {
        deviceTypeName: deviceTypeItems
          .find(it => it.get('externalId') === deviceType, EMPTY_CONTEXT, EMPTY_MAP)
          .get('name'),
      })
    ),
    displayResult: makeButton(displayResult =>
      formatMessage(messages.withDisplayResult, {
        displayResult: formatMessage(
          messages[displayResultOptions.find(it => it.id === displayResult, EMPTY_CONTEXT, EMPTY_MAP).name]
        ),
      })
    ),
    externalId: makeButton(externalId =>
      formatMessage(messages.whereExternalIdIncludes, {
        externalId,
      })
    ),
    notificationName: makeButton(notificationName =>
      formatMessage(messages.whereNotificationNameIncludes, {
        notificationName,
      })
    ),
    revoked: makeButton(revoked =>
      formatMessage(messages.withRevoked, {
        revokedStatus: revokedOptions.find(it => it.id === revoked, EMPTY_CONTEXT, EMPTY_MAP).name,
      })
    ),
    // Special keys
    deviceIds: makeButton(deviceIds =>
      formatMessage(messages.whereDeviceIdIsIn, {
        joinedIds: deviceIds,
      })
    ),
    siteIds: makeButton(siteIds =>
      formatMessage(messages.whereSiteIdIsIn, {
        joinedIds: siteIds,
      })
    ),
    onlyReportableResults: makeButton(() => formatMessage(messages.onlyReportableResults)),
    onlyDownloadedByReporter: makeButton(() => formatMessage(messages.onlyDownloadedByReporter)),
    onlyEverTransferred: makeButton(() => formatMessage(messages.onlyEverTransferred)),
    onlyTreatmentRequired: makeButton(() => formatMessage(messages.onlyTreatmentRequired)),
    onlyTransfers: makeButton(() => formatMessage(messages.onlyTransfers)),
    issueTypeId: makeButton(issueTypeId =>
      formatMessage(messages.deviceIssueType, {
        issueTypeId: startCase(issueTypeId),
      })
    ),
    assayOverride: () => false,
    daysStockLeft: makeButton(daysStockLeft => formatMessage(messages[daysStockLeft])),
    hasStock: makeButton(() => formatMessage(messages.hasStock)),
    reportName: makeButton(reportName =>
      formatMessage(messages.whereReportNameIncludes, {
        reportName,
      })
    ),
    lotNumber: makeButton(lotNumber =>
      formatMessage(messages.whereLotNumberIncludes, {
        lotNumber,
      })
    ),
    contactStatus: makeButton(status =>
      formatMessage(messages.contactEnabledStatus, {
        contactStatus:
          status === '0' ? formatMessage(commonDefinitions.enabled) : formatMessage(commonDefinitions.disabled),
      })
    ),
    connectorStatus: makeButton(connectorStatus =>
      formatMessage(messages.withConnectorStatus, {
        connectorStatus: formatMessage(messages[connectorStatus]),
      })
    ),
  }

  return (
    <div className={cssClasses('FiltersBtnGroup')}>
      {children}
      {Immutable.Map(restProps.filters)
        .keySeq()
        .sortBy(filterKey => filtersOrdering[filterKey])
        .map(filterKey => buttonBy[filterKey](filterKey, restProps))}
    </div>
  )
}

export default enhance(FiltersBtnGroup)
