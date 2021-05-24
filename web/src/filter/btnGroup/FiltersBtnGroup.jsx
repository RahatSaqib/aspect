import Immutable from 'immutable'
import classnames from 'classnames/bind'
import React, { Children } from 'react'
import { compose, pure } from 'recompose'
import { defineMessages } from 'react-intl'
import { connect } from 'react-redux'
import Button from '@material-ui/core/Button'
import { MdClose } from 'react-icons/md'
import startCase from 'lodash/startCase'

import { forceBaseFormatDate } from '../../components/shared/DateTimeInput/utils/date'

const cssClasses = classnames.bind(require('./FiltersBtnGroup.css'))

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
  whereReportableSiteNameIncludes: {
    id: 'filter.btnGroup.whereReportableSiteNameIncludes',
    defaultMessage: 'reportable site name includes "{reportableSiteName}"',
  },
  whereSiteIdIncludes: {
    id: 'filter.btnGroup.whereSiteIdIncludes',
    defaultMessage: 'site ID includes "{siteId}"',
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
  outOfStock: {
    id: 'filter.btnGroup.stockLeft.outOfStock',
    defaultMessage: 'Out of Stock',
  },
  upTo14: {
    id: 'filter.btnGroup.stockLeft.upTo14',
    defaultMessage: '1-14 Days',
  },
  upTo30: {
    id: 'filter.btnGroup.stockLeft.upTo30',
    defaultMessage: '15-30 Days',
  },
  upTo90: {
    id: 'filter.btnGroup.stockLeft.upTo90',
    defaultMessage: '1-3 Months',
  },
  upTo180: {
    id: 'filter.btnGroup.stockLeft.upTo180',
    defaultMessage: '4-6 Months',
  },
  moreThan180: {
    id: 'filter.btnGroup.stockLeft.moreThan180',
    defaultMessage: '>6 Months',
  },
  notRecorded: {
    id: 'filter.btnGroup.stockLeft.notRecorded',
    defaultMessage: 'Not Recorded',
  },
  noConsumption: {
    id: 'filter.btnGroup.stockLeft.noConsumption',
    defaultMessage: 'No Consumption',
  },
  whereReportNameIncludes: {
    id: 'filter.btnGroup.whereReportNameIncludes',
    defaultMessage: 'report name includes "{reportName}"',
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
const enhance = compose(
  pure,
  connect(
    state => ({
      siteItemsById: state.site.selectList.items,
      countryItems: state.geography.countriesForLocationSelector.items,
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
  siteName: 12,
  reportableSiteName: 33,
  sampleOriginSite: 13,
  contactNameOrEmail: 14,
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
  stockLeft: 31,
  reportName: 32,
}

const makeButton = labelFn => (props, filterKey) => (
  <Button
    key={filterKey}
    className={cssClasses('Button')}
    color="secondary"
    variant="contained"
    onClick={() => props.onRemoveFilterItem(filterKey)}
  >
    {labelFn(props, props.filters[filterKey])}
    <MdClose className={cssClasses('Button__icon')} />
  </Button>
)

const buttonBy = {
  assayId: makeButton(({ assayItems }, assayId) =>
    assayItems
      .find(it => it.get('id') === assayId, EMPTY_CONTEXT, EMPTY_MAP)
      .get('name')
  ),
  diseaseId: makeButton(({ diseaseItems }, diseaseId) =>
    diseaseItems
      .find(it => it.get('id') === diseaseId, EMPTY_CONTEXT, EMPTY_MAP)
      .get('name')
  ),
  countryId: makeButton(({ countryItems }, countryId) =>
    countryItems
      .find(it => it.id === countryId, EMPTY_CONTEXT, EMPTY_MAP)
      .get('name')
  ),
  stateId: makeButton(({ countryItems, filters }, stateId) =>
    countryItems
      .find(it => it.id === filters.countryId, EMPTY_CONTEXT, EMPTY_MAP)
      .getIn(['children', 'items'], EMPTY_MAP)
      .find(it => it.id === stateId, EMPTY_CONTEXT, EMPTY_MAP)
      .get('name')
  ),
  lgaId: makeButton(({ countryItems, filters }, lgaId) =>
    countryItems
      .find(it => it.id === filters.countryId, EMPTY_CONTEXT, EMPTY_MAP)
      .getIn(['children', 'items'], EMPTY_MAP)
      .find(it => it.id === filters.stateId, EMPTY_CONTEXT, EMPTY_MAP)
      .getIn(['children', 'items'], EMPTY_MAP)
      .find(it => it.id === lgaId, EMPTY_CONTEXT, EMPTY_MAP)
      .get('name')
  ),
  minDate: makeButton(({ intl }, date) => {
    return intl.formatMessage(messages.dateFrom, {
      date: forceBaseFormatDate(date),
    })
  }),
  maxDate: makeButton(({ intl }, date) =>
    intl.formatMessage(messages.dateTo, {
      date: forceBaseFormatDate(date),
    })
  ),
  partnerId: makeButton(({ intl, partnerItems }, partnerId) =>
    intl.formatMessage(messages.partnerId, {
      partnerName: partnerItems
        .find(it => it.get('id') === partnerId, EMPTY_CONTEXT, EMPTY_MAP)
        .get('name'),
    })
  ),
  patientOrResearchId: makeButton(({ intl }, patientOrResearchId) =>
    intl.formatMessage(messages.patientOrResearchId, { patientOrResearchId })
  ),
  patientOrCaseId: makeButton(({ intl }, patientOrCaseId) =>
    intl.formatMessage(messages.patientOrCaseId, { patientOrCaseId })
  ),
  sampleId: makeButton(({ intl }, sampleId) =>
    intl.formatMessage(messages.sampleId, { sampleId })
  ),
  deviceName: makeButton(({ intl }, deviceName) =>
    intl.formatMessage(messages.whereDeviceNameIncludes, {
      deviceName,
    })
  ),
  siteId: makeButton(({ intl }, siteId) =>
    intl.formatMessage(messages.whereSiteIdIncludes, {
      siteId,
    })
  ),
  resultCategoryId: makeButton(
    ({ intl, filters, assayItems }, resultCategoryId) =>
      intl.formatMessage(
        messages.withResultCategory,
        filters.assayOverride
          ? {
              resultCategoryName: `"${startCase(filters.assayOverride)}"`,
            }
          : {
              resultCategoryName: assayItems
                .find(
                  it => it.get('id') === filters.assayId,
                  EMPTY_CONTEXT,
                  EMPTY_MAP
                )
                .get('resultCategories', EMPTY_MAP)
                .find(
                  it => it.get('id') === resultCategoryId,
                  EMPTY_CONTEXT,
                  EMPTY_MAP
                )
                .get('name', ''),
            }
      )
  ),
  resultCategoryGroupId: makeButton(
    ({ intl, filters, resultCategoryGroupItems }, resultCategoryGroupId) => {
      return intl.formatMessage(
        messages.withResultCategoryGroup,
        filters.assayOverride
          ? {
              resultCategoryGroupName: `"${startCase(filters.assayOverride)}"`,
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
  errorCode: makeButton(({ intl }, errorCode) =>
    intl.formatMessage(messages.errorCode, { errorCode })
  ),
  siteName: makeButton(({ intl }, siteName) =>
    intl.formatMessage(messages.whereSiteNameIncludes, {
      siteName,
    })
  ),
  reportableSiteName: makeButton(({ intl }, reportableSiteName) =>
    intl.formatMessage(messages.whereReportableSiteNameIncludes, {
      reportableSiteName,
    })
  ),
  sampleOriginSite: makeButton(({ intl, siteItemsById }, sampleOriginSiteId) =>
    intl.formatMessage(messages.sampleOriginSite, {
      sampleOriginSiteName: siteItemsById
        .find(
          it => it.get('name') === sampleOriginSiteId,
          EMPTY_CONTEXT,
          EMPTY_MAP
        )
        .get('name'),
    })
  ),
  contactNameOrEmail: makeButton(({ intl }, contactNameOrEmail) =>
    intl.formatMessage(messages.whoseNameOrEmailIncludes, {
      contactNameOrEmail,
    })
  ),
  consumableId: makeButton(({ consumableItems }, consumableId) =>
    consumableItems
      .find(it => it.get('id') === consumableId, EMPTY_CONTEXT, EMPTY_MAP)
      .get('name')
  ),
  workflowStatusId: makeButton(
    ({ intl, workflowStatusItems }, workflowStatusId) =>
      intl.formatMessage(messages.withWorkflowStatus, {
        workflowStatusName: workflowStatusItems
          .find(
            it => it.get('id') === workflowStatusId,
            EMPTY_CONTEXT,
            EMPTY_MAP
          )
          .get('name'),
      })
  ),
  treatmentStatus: makeButton(
    ({ intl, treatmentStatusItems }, treatmentStatus) =>
      intl.formatMessage(messages.withTreatmentStatus, {
        treatmentStatusName: treatmentStatusItems
          .find(
            it => it.get('externalId') === treatmentStatus,
            EMPTY_CONTEXT,
            EMPTY_MAP
          )
          .get('name'),
      })
  ),
  deviceApprovalId: makeButton(
    ({ intl, deviceApprovalItems }, deviceApprovalId) =>
      intl.formatMessage(messages.withDeviceApproval, {
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
    ({ intl, deviceMaintenanceStatusItems }, deviceMaintenanceStatusId) =>
      intl.formatMessage(messages.withDeviceMaintenanceStatus, {
        deviceMaintenanceStatusName: deviceMaintenanceStatusItems
          .find(
            it => it.get('externalId') === deviceMaintenanceStatusId,
            EMPTY_CONTEXT,
            EMPTY_MAP
          )
          .get('name'),
      })
  ),
  deviceTypeId: makeButton(({ intl, deviceTypeItems }, deviceTypeId) =>
    intl.formatMessage(messages.withDeviceType, {
      deviceTypeName: deviceTypeItems
        .find(it => it.get('id') === deviceTypeId, EMPTY_CONTEXT, EMPTY_MAP)
        .get('name'),
    })
  ),
  deviceType: makeButton(({ intl, deviceTypeItems }, deviceType) =>
    intl.formatMessage(messages.withDeviceType, {
      deviceTypeName: deviceTypeItems
        .find(
          it => it.get('externalId') === deviceType,
          EMPTY_CONTEXT,
          EMPTY_MAP
        )
        .get('name'),
    })
  ),
  externalId: makeButton(({ intl }, externalId) =>
    intl.formatMessage(messages.whereExternalIdIncludes, {
      externalId,
    })
  ),
  notificationName: makeButton(({ intl }, notificationName) =>
    intl.formatMessage(messages.whereNotificationNameIncludes, {
      notificationName,
    })
  ),

  revoked: makeButton(({ intl }, revoked) =>
    intl.formatMessage(messages.withRevoked, {
      revokedStatus: revokedOptions.find(
        it => it.id === revoked,
        EMPTY_CONTEXT,
        EMPTY_MAP
      ).name,
    })
  ),
  // Special keys
  deviceIds: makeButton(({ intl }, deviceIds) =>
    intl.formatMessage(messages.whereDeviceIdIsIn, {
      joinedIds: deviceIds,
    })
  ),
  siteIds: makeButton(({ intl }, siteIds) =>
    intl.formatMessage(messages.whereSiteIdIsIn, {
      joinedIds: siteIds,
    })
  ),
  onlyReportableResults: makeButton(({ intl }) =>
    intl.formatMessage(messages.onlyReportableResults)
  ),
  onlyDownloadedByReporter: makeButton(({ intl }) =>
    intl.formatMessage(messages.onlyDownloadedByReporter)
  ),
  onlyEverTransferred: makeButton(({ intl }) =>
    intl.formatMessage(messages.onlyEverTransferred)
  ),
  onlyTreatmentRequired: makeButton(({ intl }) =>
    intl.formatMessage(messages.onlyTreatmentRequired)
  ),
  issueTypeId: makeButton(({ intl }, issueTypeId) =>
    intl.formatMessage(messages.deviceIssueType, {
      issueTypeId: startCase(issueTypeId),
    })
  ),
  assayOverride: () => false,
  stockLeft: makeButton(({ intl }, stockLeft) =>
    intl.formatMessage(messages[stockLeft])
  ),
  reportName: makeButton(({ intl }, reportName) =>
    intl.formatMessage(messages.whereReportNameIncludes, {
      reportName,
    })
  ),
}

const FiltersBtnGroup = ({ className, children, ...restProps }) => {
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
        .map(filterKey => buttonBy[filterKey](restProps, filterKey))}
    </div>
  )
}

export default enhance(FiltersBtnGroup)
