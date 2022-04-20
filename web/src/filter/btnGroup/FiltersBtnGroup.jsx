import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React, { Children } from 'react'
import { compose, pure } from 'recompose'
import { defineMessages } from 'react-intl'
import { connect } from 'react-redux'
import Button from '@material-ui/core/Button'
import { MdClose } from 'react-icons/md'
import startCase from 'lodash/startCase'
import isArray from 'lodash/isArray'

import { forceBaseFormatDate } from '../../components/shared/DateTimeInput/utils/date'
import { isCountryFilterHidden } from '../utils'
import useI18n from '../../Hooks/i18n/useI18n'

import styles from './FiltersBtnGroup.css'

const cssClasses = classnames.bind(styles)

const EMPTY_CONTEXT = null
const EMPTY_MAP = Immutable.Map()

const messages = defineMessages({
  dateFrom: {
    id: 'filter.btnGroup.dateFrom',
    defaultMessage: 'since {date}',
  },
  dateTo: {
    id: 'filter.btnGroup.dateTo',
    defaultMessage: 'until {date}',
  },
  partnerId: {
    id: 'filter.btnGroup.partnerId',
    defaultMessage: 'partner "{partnerName}"',
  },
  patientOrResearchId: {
    id: 'filter.btnGroup.patientOrResearchId',
    defaultMessage: 'patient ID includes {patientOrResearchId}',
  },
  patientOrCaseId: {
    id: 'filter.btnGroup.patientOrCaseId',
    defaultMessage: 'patient/case ID includes {patientOrCaseId}',
  },
  sampleId: {
    id: 'filter.btnGroup.sampleId',
    defaultMessage: 'sample includes "{sampleId}"',
  },
  errorCode: {
    id: 'filter.btnGroup.errorCode',
    defaultMessage: 'error code includes "{errorCode}"',
  },
  whereDeviceNameIncludes: {
    id: 'filter.btnGroup.whereDeviceNameIncludes',
    defaultMessage: 'device name includes "{deviceName}"',
  },
  withResultCategory: {
    id: 'filter.btnGroup.withResultCategory',
    defaultMessage: 'with result {resultCategoryName}',
  },
  withResultCategoryGroup: {
    id: 'filter.btnGroup.withResultCategoryGroup',
    defaultMessage: 'with result {resultCategoryGroupName}',
  },
  whereSiteNameIncludes: {
    id: 'filter.btnGroup.whereSiteNameIncludes',
    defaultMessage: 'site name includes "{siteName}"',
  },
  whereSiteIdIncludes: {
    id: 'filter.btnGroup.whereSiteIdIncludes',
    defaultMessage: 'site ID includes "{siteId}"',
  },
  whereReportableSiteNameIncludes: {
    id: 'filter.btnGroup.whereReportableSiteNameIncludes',
    defaultMessage: 'reportable site name includes "{reportableSiteName}"',
  },
  whereReportableSiteName: {
    id: 'filter.btnGroup.whereReportableSiteIs',
    defaultMessage: 'reportable site "{reportableSiteName}"',
  },
  whereReportableSiteIdIncludes: {
    id: 'filter.btnGroup.whereSiteIdIncludes',
    defaultMessage: 'reportable site ID includes "{reportableSiteId}"',
  },
  sampleOriginSite: {
    id: 'filter.btnGroup.sampleOriginSite',
    defaultMessage: 'sample collection site is {sampleOriginSiteName}',
  },
  whoseNameOrEmailIncludes: {
    id: 'filter.btnGroup.whoseNameOrEmailIncludes',
    defaultMessage: 'name/email includes "{contactNameOrEmail}"',
  },
  withWorkflowStatus: {
    id: 'filter.btnGroup.withWorkflowStatus',
    defaultMessage: 'workflow status is {workflowStatusName}',
  },
  withTreatmentStatus: {
    id: 'filter.btnGroup.withTreatmentStatus',
    defaultMessage: 'treatment status is {treatmentStatusName}',
  },
  withDeviceApproval: {
    id: 'filter.btnGroup.withDeviceApproval',
    defaultMessage: 'approval status is {deviceApprovalName}',
  },
  withDeviceMaintenanceStatus: {
    id: 'filter.btnGroup.withDeviceMaintenanceStatus',
    defaultMessage: 'maintenance status is {deviceMaintenanceStatusName}',
  },
  withDeviceType: {
    id: 'filter.btnGroup.withDeviceType',
    defaultMessage: 'type is {deviceTypeName}',
  },
  whereExternalIdIncludes: {
    id: 'filter.btnGroup.whereExternalIdIncludes',
    defaultMessage: 'ID includes "{externalId}"',
  },
  whereDeviceIdIsIn: {
    id: 'filter.btnGroup.whereDeviceIdIsIn',
    defaultMessage: 'deviceId is in ({joinedIds})',
  },
  whereSiteIdIsIn: {
    id: 'filter.btnGroup.whereSiteIdIsIn',
    defaultMessage: 'site ID is in ({joinedIds})',
  },
  whereNotificationNameIncludes: {
    id: 'filter.btnGroup.whereNotificationNameIncludes',
    defaultMessage: 'notification name includes "{notificationName}"',
  },
  withRevoked: {
    id: 'filter.btnGroup.withRevoked',
    defaultMessage: 'revoked is "{revokedStatus}"',
  },
  onlyReportableResults: {
    id: 'filter.btnGroup.onlyReportableResults',
    defaultMessage: 'Show Only Reportable Results',
  },
  onlyDownloadedByReporter: {
    id: 'filter.btnGroup.onlyDownloadedByReporter',
    defaultMessage: 'Show Only Results Downloaded By Reporter',
  },
  onlyEverTransferred: {
    id: 'filter.btnGroup.onlyEverTransferred',
    defaultMessage: 'Show Only Results Ever Transferred',
  },
  onlyTreatmentRequired: {
    id: 'filter.btnGroup.onlyTreatmentRequired',
    defaultMessage: 'Show Only Results With Treatment Required',
  },
  deviceIssueType: {
    id: 'filter.btnGroup.deviceIssueType',
    defaultMessage: 'Device Issue: {issueTypeId}',
  },
  hasStock: {
    id: 'filter.btnGroup.hasStock',
    defaultMessage: 'Only lots with stock',
  },
  outOfStock: {
    id: 'filter.btnGroup.daysStockLeft.outOfStock',
    defaultMessage: 'Out of Stock',
  },
  upTo14: {
    id: 'filter.btnGroup.daysStockLeft.upTo14',
    defaultMessage: '1-14 Days',
  },
  upTo30: {
    id: 'filter.btnGroup.daysStockLeft.upTo30',
    defaultMessage: '15-30 Days',
  },
  upTo90: {
    id: 'filter.btnGroup.daysStockLeft.upTo90',
    defaultMessage: '1-3 Months',
  },
  upTo180: {
    id: 'filter.btnGroup.daysStockLeft.upTo180',
    defaultMessage: '4-6 Months',
  },
  moreThan180: {
    id: 'filter.btnGroup.daysStockLeft.moreThan180',
    defaultMessage: '>6 Months',
  },
  notRecorded: {
    id: 'filter.btnGroup.daysStockLeft.notRecorded',
    defaultMessage: 'Not Recorded',
  },
  noConsumption: {
    id: 'filter.btnGroup.daysStockLeft.noConsumption',
    defaultMessage: 'No Consumption',
  },
  whereReportNameIncludes: {
    id: 'filter.btnGroup.whereReportNameIncludes',
    defaultMessage: 'report name includes "{reportName}"',
  },
  whereLotNumberIncludes: {
    id: 'filter.btnGroup.whereLotNumberIncludes',
    defaultMessage: 'lot number includes "{lotNumber}"',
  },
  contactEnabledStatus: {
    id: 'filter.btnGroup.contactEnabledStatus',
    defaultMessage: 'Contact Status: {contactStatus}',
  },
})
const revokedOptions = [
  {
    id: '0',
    name: 'false',
  },
  {
    id: '1',
    name: 'true',
  },
]
const statusOptions = [
  {
    id: '0',
    name: 'Enabled',
  },
  {
    id: '1',
    name: 'Disabled',
  },
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
      onClick={() => props.onRemoveFilterItem(filterKey, index)}
    >
      {labelFn(filterValue, props)}
      <MdClose className={cssClasses('Button__icon')} />
    </Button>
  )
}

const getResultCategoryName = (assayItems, filterAssayId, resultCategoryId) => {
  const assayIds = isArray(filterAssayId) ? filterAssayId : [filterAssayId]
  return assayItems
    .find(it => assayIds.includes(it.get('id')), EMPTY_CONTEXT, EMPTY_MAP)
    .get('resultCategories', EMPTY_MAP)
    .find(it => it.get('id') === resultCategoryId, EMPTY_CONTEXT, EMPTY_MAP)
    .get('name', '')
}

const FiltersBtnGroup = ({ className, children, ...restProps }) => {
  const buttonBy = {
    assayId: (filterKey, props) => {
      const {
        assayItems,
        filters: { assayId },
      } = props
      const assayIds = isArray(assayId) ? assayId : [assayId]
      return assayIds.map((__, index) =>
        makeButton(value =>
          assayItems
            .find(it => it.get('id') === value, EMPTY_CONTEXT, EMPTY_MAP)
            .get('name')
        )(filterKey, props, index)
      )
    },
    diseaseId: makeButton((diseaseId, { diseaseItems }) =>
      diseaseItems
        .find(it => it.get('id') === diseaseId, EMPTY_CONTEXT, EMPTY_MAP)
        .get('name')
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
        countryItems
          .find(it => it.id === countryId, EMPTY_CONTEXT, EMPTY_MAP)
          .get('name')
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
        date: forceBaseFormatDate(date),
      })
    ),
    maxDate: makeButton(date =>
      formatMessage(messages.dateTo, {
        date: forceBaseFormatDate(date),
      })
    ),
    partnerId: makeButton((partnerId, { partnerItems }) =>
      formatMessage(messages.partnerId, {
        partnerName: partnerItems
          .find(it => it.get('id') === partnerId, EMPTY_CONTEXT, EMPTY_MAP)
          .get('name'),
      })
    ),
    patientOrResearchId: makeButton(patientOrResearchId =>
      formatMessage(messages.patientOrResearchId, { patientOrResearchId })
    ),
    patientOrCaseId: makeButton(patientOrCaseId =>
      formatMessage(messages.patientOrCaseId, { patientOrCaseId })
    ),
    sampleId: makeButton(sampleId =>
      formatMessage(messages.sampleId, { sampleId })
    ),
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
              resultCategoryName: getResultCategoryName(
                assayItems,
                filters.assayId,
                resultCategoryId
              ),
            }
      )
    ),
    resultCategory2Id: makeButton(
      (resultCategory2Id, { filters, assayItems }) =>
        formatMessage(messages.withResultCategory, {
          resultCategoryName: getResultCategoryName(
            assayItems,
            filters.assayId,
            resultCategory2Id
          ),
        })
    ),
    resultCategoryGroupId: makeButton(
      (resultCategoryGroupId, { filters, resultCategoryGroupItems }) => {
        return formatMessage(
          messages.withResultCategoryGroup,
          filters.assayOverride
            ? {
                resultCategoryGroupName: `"${startCase(
                  filters.assayOverride
                )}"`,
              }
            : {
                resultCategoryGroupName: resultCategoryGroupItems
                  .find(
                    it => it.get('externalId') === resultCategoryGroupId,
                    EMPTY_CONTEXT,
                    EMPTY_MAP
                  )
                  .get('name'),
              }
        )
      }
    ),
    errorCode: makeButton(errorCode =>
      formatMessage(messages.errorCode, { errorCode })
    ),
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
    sampleOriginSite: makeButton((sampleOriginSiteId, { siteItemsById }) =>
      formatMessage(messages.sampleOriginSite, {
        sampleOriginSiteName: siteItemsById
          .find(
            it => it.get('name') === sampleOriginSiteId,
            EMPTY_CONTEXT,
            EMPTY_MAP
          )
          .get('name'),
      })
    ),
    contactNameOrEmail: makeButton(contactNameOrEmail =>
      formatMessage(messages.whoseNameOrEmailIncludes, {
        contactNameOrEmail,
      })
    ),
    consumableId: makeButton((consumableId, { consumableItems }) =>
      consumableItems
        .find(it => it.get('id') === consumableId, EMPTY_CONTEXT, EMPTY_MAP)
        .get('name')
    ),
    workflowStatusId: makeButton((workflowStatusId, { workflowStatusItems }) =>
      formatMessage(messages.withWorkflowStatus, {
        workflowStatusName: workflowStatusItems
          .find(
            it => it.get('id') === workflowStatusId,
            EMPTY_CONTEXT,
            EMPTY_MAP
          )
          .get('name'),
      })
    ),
    treatmentStatus: makeButton((treatmentStatus, { treatmentStatusItems }) =>
      formatMessage(messages.withTreatmentStatus, {
        treatmentStatusName: treatmentStatusItems
          .find(
            it => it.get('externalId') === treatmentStatus,
            EMPTY_CONTEXT,
            EMPTY_MAP
          )
          .get('name'),
      })
    ),
    deviceApprovalId: makeButton((deviceApprovalId, { deviceApprovalItems }) =>
      formatMessage(messages.withDeviceApproval, {
        deviceApprovalName: deviceApprovalItems
          .find(
            it => it.get('id') === deviceApprovalId,
            EMPTY_CONTEXT,
            EMPTY_MAP
          )
          .get('name'),
      })
    ),
    deviceMaintenanceStatusId: makeButton(
      (deviceMaintenanceStatusId, { deviceMaintenanceStatusItems }) =>
        formatMessage(messages.withDeviceMaintenanceStatus, {
          deviceMaintenanceStatusName: deviceMaintenanceStatusItems
            .find(
              it => it.get('externalId') === deviceMaintenanceStatusId,
              EMPTY_CONTEXT,
              EMPTY_MAP
            )
            .get('name'),
        })
    ),
    deviceTypeId: makeButton((deviceTypeId, { deviceTypeItems }) =>
      formatMessage(messages.withDeviceType, {
        deviceTypeName: deviceTypeItems
          .find(it => it.get('id') === deviceTypeId, EMPTY_CONTEXT, EMPTY_MAP)
          .get('name'),
      })
    ),
    deviceType: makeButton((deviceType, { deviceTypeItems }) =>
      formatMessage(messages.withDeviceType, {
        deviceTypeName: deviceTypeItems
          .find(
            it => it.get('externalId') === deviceType,
            EMPTY_CONTEXT,
            EMPTY_MAP
          )
          .get('name'),
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
        revokedStatus: revokedOptions.find(
          it => it.id === revoked,
          EMPTY_CONTEXT,
          EMPTY_MAP
        ).name,
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
    onlyReportableResults: makeButton(() =>
      formatMessage(messages.onlyReportableResults)
    ),
    onlyDownloadedByReporter: makeButton(() =>
      formatMessage(messages.onlyDownloadedByReporter)
    ),
    onlyEverTransferred: makeButton(() =>
      formatMessage(messages.onlyEverTransferred)
    ),
    onlyTreatmentRequired: makeButton(() =>
      formatMessage(messages.onlyTreatmentRequired)
    ),
    issueTypeId: makeButton(issueTypeId =>
      formatMessage(messages.deviceIssueType, {
        issueTypeId: startCase(issueTypeId),
      })
    ),
    assayOverride: () => false,
    daysStockLeft: makeButton(daysStockLeft =>
      formatMessage(messages[daysStockLeft])
    ),
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
        contactStatus: statusOptions.find(
          it => it.id === status,
          EMPTY_CONTEXT,
          EMPTY_MAP
        ).name,
      })
    ),
  }

  const { formatMessage } = useI18n()
  return (
    <div className={cssClasses(className, 'FiltersBtnGroup')}>
      {children &&
        Children.map(children, child =>
          React.cloneElement(child, {
            className: cssClasses('FiltersBtnGroup__Child'),
          })
        )}
      {Immutable.Map(restProps.filters)
        .keySeq()
        .sortBy(filterKey => filtersOrdering[filterKey])
        .map(filterKey => buttonBy[filterKey](filterKey, restProps))}
    </div>
  )
}

export default enhance(FiltersBtnGroup)
