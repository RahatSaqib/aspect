import { defineMessages } from 'react-intl'
import {
  assay,
  consumableMessages,
  deviceApprovalMessages,
  deviceStatusMessages,
  resultCategory,
  resultTreatmentStatusMessages,
  resultWorkflowStatusMessages,
} from '../../messages'

const messages = {
  ...consumableMessages,
  ...resultCategory,
  ...resultWorkflowStatusMessages,
  ...resultTreatmentStatusMessages,
  ...deviceStatusMessages,
  ...deviceApprovalMessages,
  ...assay,
  ...defineMessages({
    noFilters: {
      id: 'filter.btnGroup.noFilters',
      defaultMessage: 'No Filters Applied',
    },
    dateFrom: {
      id: 'filter.btnGroup.dateFrom',
      defaultMessage: 'since {date}',
    },
    dateTo: {
      id: 'filter.btnGroup.dateTo',
      defaultMessage: 'until {date}',
    },
    expDateFrom: {
      id: 'filter.btnGroup.expDateFrom',
      defaultMessage: 'Exp. since {date}',
    },
    expDateTo: {
      id: 'filter.btnGroup.expDateTo',
      defaultMessage: 'Exp. until {date}',
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
    whereOriginSiteNameIncludes: {
      id: 'filter.btnGroup.whereOriginSiteNameIncludes',
      defaultMessage: 'origin site name includes "{originSiteName}"',
    },
    whereDestinationSiteNameIncludes: {
      id: 'filter.btnGroup.whereDestinationSiteNameIncludes',
      defaultMessage: 'destination site name includes "{destinationSiteName}"',
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
    withConnectorStatus: {
      id: 'filter.btnGroup.withConnectorStatus',
      defaultMessage: 'Connector Status is {connectorStatus}',
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
    onlyTransfers: {
      id: 'filter.btnGroup.onlyTransfers',
      defaultMessage: 'Show Only Transfers',
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
    all: {
      id: 'filter.btnGroup.all',
      defaultMessage: 'All',
    },
    online: {
      id: 'filter.btnGroup.online',
      defaultMessage: 'Online',
    },
    offline: {
      id: 'filter.btnGroup.offline',
      defaultMessage: 'Offline',
    },

    withDisplayResult: {
      id: 'filter.btnGroup.withDisplayResult',
      defaultMessage: 'display "{displayResult}"',
    },
    displayAllResults: {
      id: 'filter.btnGroup.displayAllResults',
      defaultMessage: 'All Results',
    },
    displayActualResults: {
      id: 'filter.btnGroup.displayActualResults',
      defaultMessage: 'Actual Results',
    },
    displayExcludedResults: {
      id: 'filter.btnGroup.displayExcludedResults',
      defaultMessage: 'Excluded Results',
    },
    GxMtbRifMTBErrorRifError: {
      id: 'pages.filters.GxMtbRifMTBErrorRifError',
      defaultMessage: 'MTB Error Rif Error',
    },
    gxMtbRifUltraMtbDetectedRifIndeterminate: {
      id: 'pages.filters.gxMtbRifUltraMtbDetectedRifIndeterminate',
      defaultMessage: 'MTB Detected - Rif Indeterminate',
    },
    GxMtbRifUltraMTBTraceDetectedRifIndeterminate: {
      id: 'pages.filters.GxMtbRifUltraMTBTraceDetectedRifIndeterminate',
      defaultMessage: 'MTB Trace Detected Rif Indeterminate',
    },
    GxMtbRifUltraMTBTraceDetectedRifNoResult: {
      id: 'pages.filters.GxMtbRifUltraMTBTraceDetectedRifNoResult',
      defaultMessage: 'MTB Trace Detected Rif No Result',
    },
    GxMtbXdrMTBNotDetectedDrugResistanceNotDetected: {
      id: 'pages.filters.GxMtbXdrMTBNotDetectedDrugResistanceNotDetected',
      defaultMessage: 'MTB Not Detected Drug Resistance Not Detected',
    },
    breakOutByLot: {
      id: 'pages.InventoryItemsList.breakOutByLot',
      defaultMessage: 'Break Out by Lot',
    },
  }),
}

export default messages
