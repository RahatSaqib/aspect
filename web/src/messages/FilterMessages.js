import { defineMessages } from 'react-intl'
import { commonDefinitions } from './customMessages'

const messages = {
  ...commonDefinitions,
  ...defineMessages({
    applyFilters: {
      id: 'filter.popover.applyFilters',
      defaultMessage: 'Apply Filters',
    },
    moreFilters: {
      id: 'filter.popover.moreFilters',
      defaultMessage: 'More filters',
    },
    close: {
      id: 'filter.popover.close',
      defaultMessage: 'Close',
    },
    all: {
      id: 'filter.popover.all',
      defaultMessage: 'All',
    },
    none: {
      id: 'filter.popover.none',
      defaultMessage: 'None',
    },
    contactNameEmail: {
      id: 'filter.popover.contactNameEmail',
      defaultMessage: 'Contact name/email',
    },
    setContactNameEmail: {
      id: 'filter.popover.setContactNameEmail',
      defaultMessage: 'Enter contact name/email...',
    },
    site: {
      id: 'filter.popover.siteName',
      defaultMessage: 'Site',
    },
    originSiteName: {
      id: 'filter.popover.originSiteName',
      defaultMessage: 'Origin Site',
    },
    destinationSiteName: {
      id: 'filter.popover.destinationSiteName',
      defaultMessage: 'Destination Site',
    },
    reportableSite: {
      id: 'filter.popover.site',
      defaultMessage: 'Reportable Site',
    },
    siteId: {
      id: 'filter.popover.siteId',
      defaultMessage: 'Site Id',
    },
    enterSiteName: {
      id: 'filter.popover.enterSiteName',
      defaultMessage: 'Enter site name...',
    },
    enterReportableSiteName: {
      id: 'filter.popover.enterReportableSiteName',
      defaultMessage: 'Enter reportable site name...',
    },
    enterReportableSiteId: {
      id: 'filter.popover.enterReportableSiteId',
      defaultMessage: 'Enter reportable site...',
    },
    enterSiteId: {
      id: 'filter.popover.enterSiteId',
      defaultMessage: 'Enter site ID...',
    },
    sampleOriginSite: {
      id: 'filter.popover.sampleOriginSite',
      defaultMessage: 'Sample collection site',
    },
    enterSampleOriginSite: {
      id: 'filter.popover.enterSampleOriginSite',
      defaultMessage: 'Enter sample origin site name...',
    },
    date: {
      id: 'filter.popover.date',
      defaultMessage: 'Date',
    },
    expirationDate: {
      id: 'filter.popover.expirationDate',
      defaultMessage: 'Expiration date',
    },
    deviceName: {
      id: 'filter.popover.deviceName',
      defaultMessage: 'Device',
    },
    deviceApiKey: {
      id: 'filter.popover.deviceApiKey',
      defaultMessage: 'Device API Key',
    },
    enterDeviceName: {
      id: 'filter.popover.enterDeviceName',
      defaultMessage: 'Enter device name...',
    },
    consumable: {
      id: 'filter.popover.consumable',
      defaultMessage: 'Consumable',
    },
    selectConsumable: {
      id: 'filter.popover.selectConsumable',
      defaultMessage: 'Select consumable...',
    },
    partner: {
      id: 'filter.popover.partner',
      defaultMessage: 'Partner',
    },
    selectPartner: {
      id: 'filter.popover.selectPartner',
      defaultMessage: 'Select partner...',
    },
    patientOrResearchId: {
      id: 'filter.popover.patientOrResearchId',
      defaultMessage: 'Patient ID',
    },
    enterPatientOrResearchId: {
      id: 'filter.popover.enterPatientOrResearchId',
      defaultMessage: 'Enter patient ID...',
    },
    patientOrCaseId: {
      id: 'filter.popover.patientOrCaseId',
      defaultMessage: 'Patient/Case ID',
    },
    enterPatientOrCaseId: {
      id: 'filter.popover.enterPatientOrCaseId',
      defaultMessage: 'Enter patient/case ID...',
    },
    sampleId: {
      id: 'filter.popover.sampleId',
      defaultMessage: 'Sample ID',
    },
    enterSampleId: {
      id: 'filter.popover.enterSampleId',
      defaultMessage: 'Enter sample ID...',
    },
    errorCode: {
      id: 'filter.popover.errorCode',
      defaultMessage: 'Error Code',
    },
    enterErrorCode: {
      id: 'filter.popover.enterErrorCode',
      defaultMessage: 'Enter error code...',
    },
    result: {
      id: 'filter.popover.result',
      defaultMessage: 'Result',
    },
    resultGroup: {
      id: 'filter.popover.resultGroup',
      defaultMessage: 'Result Group',
    },
    selectResult: {
      id: 'filter.popover.selectResult',
      defaultMessage: 'Select result...',
    },
    assay: {
      id: 'filter.popover.assay',
      defaultMessage: 'Assay',
    },
    selectAssay: {
      id: 'filter.popover.selectAssay',
      defaultMessage: 'Select assay...',
    },
    disease: {
      id: 'filter.popover.disease',
      defaultMessage: 'Disease',
    },
    selectDisease: {
      id: 'filter.popover.selectDisease',
      defaultMessage: 'Select Disease...',
    },
    country: {
      id: 'filter.popover.country',
      defaultMessage: 'Country',
    },
    selectCountry: {
      id: 'filter.popover.selectCountry',
      defaultMessage: 'Select country...',
    },
    setFilters: {
      id: 'filter.popover.setFilters',
      defaultMessage: 'Set Filters',
    },
    exportExcel: {
      id: 'pages.ListExport.exportExcel',
      defaultMessage: 'Excel',
    },
    exportCsv: {
      id: 'pages.ListExport.exportCsv',
      defaultMessage: 'CSV',
    },
    treatmentStatus: {
      id: 'filter.popover.treatmentStatus',
      defaultMessage: 'Treatment Status',
    },
    selectTreatmentStatus: {
      id: 'filter.popover.selectTreatmentStatus',
      defaultMessage: 'Select status...',
    },
    deviceApproval: {
      id: 'filter.popover.deviceApproval',
      defaultMessage: 'Approval',
    },
    selectDeviceApproval: {
      id: 'filter.popover.selectDeviceApproval',
      defaultMessage: 'Select approval status...',
    },
    deviceType: {
      id: 'filter.popover.deviceType',
      defaultMessage: 'Device Type',
    },
    selectDeviceType: {
      id: 'filter.popover.selectDeviceType',
      defaultMessage: 'Select type...',
    },
    externalId: {
      id: 'filter.popover.externalId',
      defaultMessage: 'Site ID',
    },
    enterExternalId: {
      id: 'filter.popover.enterExternalId',
      defaultMessage: 'Enter site ID...',
    },
    notificationName: {
      id: 'filter.popover.notificationName',
      defaultMessage: 'Notification',
    },
    selectNotificationName: {
      id: 'filter.popover.selectNotificationName',
      defaultMessage: 'Enter notification name...',
    },
    revoked: {
      id: 'filter.popover.revoked',
      defaultMessage: 'Revoked',
    },
    selectRevoked: {
      id: 'filter.popover.selectRevoked',
      defaultMessage: 'Select revoked status...',
    },
    onlyReportableResults: {
      id: 'filter.popover.onlyReportableResults',
      defaultMessage: 'Only Reportable Results',
    },
    onlyTransfers: {
      id: 'filter.popover.onlyTransfers',
      defaultMessage: 'Only transfers',
    },
    onlyDownloadedByReporter: {
      id: 'filter.popover.onlyDownloadedByReporter',
      defaultMessage: 'Only Results Downloaded By Reporter',
    },
    onlyEverTransferred: {
      id: 'filter.popover.onlyEverTransferred',
      defaultMessage: 'Only Ever Transferred Results',
    },
    onlyTreatmentRequired: {
      id: 'filter.popover.onlyTreatmentRequired',
      defaultMessage: 'Only Results With Treatment Required',
    },
    showDecommissionedDevices: {
      id: 'filter.popover.showDecommissionedDevices',
      defaultMessage: 'Show Results From Decommissioned Devices',
    },
    showResultsFromUndeployedDevices: {
      id: 'filter.popover.showResultsFromUndeployedDevices',
      defaultMessage: 'Show Results From Undeployed Devices',
    },
    onlyUnreconciled: {
      id: 'filter.popover.onlyUnreconciled',
      defaultMessage: 'Only Results With Unreconciled Inventories',
    },
    deviceMaintenanceStatus: {
      id: 'filter.popover.deviceMaintenanceStatus',
      defaultMessage: 'Maintenance Status',
    },
    geneXpertType: {
      id: 'filter.popover.geneXpertType',
      defaultMessage: 'GeneXpert Type',
    },
    geneXpertTypeTooltip: {
      id: 'filter.popover.geneXpertTypeTooltip',
      defaultMessage:
        'GeneXpert type offers a way to distinguish those GeneXpert instruments that have 10-color modules installed and are capable of running XDR tests.  In the devices details for the GeneXpert there is a field to record the number of 10-color (10c) modules installed in the instrument.  This filter captures any instrument for which the number is 1 or more',
    },
    selectDeviceMaintenanceStatus: {
      id: 'filter.popover.selectDeviceMaintenanceStatus',
      defaultMessage: 'Select maintenance status...',
    },
    selectStockLeft: {
      id: 'filter.popover.selectStockLeft',
      defaultMessage: 'Select stock left...',
    },
    daysStockLeft: {
      id: 'filter.popover.daysStockLeft',
      defaultMessage: 'Days Stock Left',
    },
    hasStock: {
      id: 'filter.popover.hasStock',
      defaultMessage: 'Has Stock',
    },
    lotNumber: {
      id: 'filter.popover.lotNumber',
      defaultMessage: 'Lot Number',
    },
    enterLotNumber: {
      id: 'filter.popover.enterLotNumber',
      defaultMessage: 'Enter lot number...',
    },
    contactStatus: {
      id: 'filter.popover.contactStatus',
      defaultMessage: 'Contact Status',
    },
    contactStatusHint: {
      id: 'filter.popover.contactStatusHint',
      defaultMessage: 'Select contact status...',
    },
    selectConnectorStatus: {
      id: 'filter.popover.selectConnectorStatus',
      defaultMessage: 'Select connector status...',
    },
    connectorStatus: {
      id: 'filter.popover.connectorStatus',
      defaultMessage: 'Connector Status',
    },
    selectDeviceStatus: {
      id: 'filter.popover.selectDeviceStatus',
      defaultMessage: 'Select Device status...',
    },
    deviceStatus: {
      id: 'filter.popover.deviceStatus',
      defaultMessage: 'Device Status',
    },
    notificationType: {
      id: 'filter.popover.notificationType',
      defaultMessage: 'Notification Type Name',
    },
    notificationCategoryType: {
      id: 'filter.popover.notificationCategoryType',
      defaultMessage: 'Notification Category Type',
    },
    patientId: {
      id: 'filter.popover.patientId',
      defaultMessage: 'Patient Id',
    },
    onlyErrors: {
      id: 'filter.popover.onlyErrors',
      defaultMessage: 'Show only notifications with errors',
    },

    displayResult: {
      id: 'filter.popover.displayResult',
      defaultMessage: 'Display Result',
    },
    selectDisplayResult: {
      id: 'filter.popover.selectDisplayResult',
      defaultMessage: 'Select result scope...',
    },
    stateName: {
      id: 'filter.popover.stateName',
      defaultMessage: 'State name',
    },
    lgaName: {
      id: 'filter.popover.lgaName',
      defaultMessage: 'LGA name',
    },
    siteType: {
      id: 'filter.popover.siteType',
      defaultMessage: 'Site Type',
    },
    tag: {
      id: 'filter.popover.tag',
      defaultMessage: 'Tag',
    },
    stockProvider: {
      id: 'filter.popover.stockProvider',
      defaultMessage: 'Stock Provider',
    },
    breakOutByLot: {
      id: 'pages.filter.InventoryItemsList.breakOutByLot',
      defaultMessage: 'Break out by lot',
    },
    expiresOn: {
      id: 'pages.InventoryLog.expiresOn',
      defaultMessage: 'Expires On',
    },
    reportName: { id: 'filter.popover.reportName', defaultMessage: 'Report' },
    reportWithName: { id: 'filter.popover.reportWithName', defaultMessage: 'Report Name' },
    cancel: { id: 'filter.popover.cancel', defaultMessage: 'Cancel' },
    apply: { id: 'filter.popover.apply', defaultMessage: 'Apply Filters' },
    sampleExternalId: { id: 'filter.popover.sampleExternalId', defaultMessage: 'Sample ID' },
    matchStatus: { id: 'filter.popover.matchStatus', defaultMessage: 'Match Status' },
    matched: { id: 'filter.popover.matched', defaultMessage: 'Matched' },
    noMatch: { id: 'filter.popover.noMatch', defaultMessage: 'No Match' },
    whereSiteIs: { id: 'filter.whereSiteIs', defaultMessage: 'Site: {siteName}' },
    sampleExternalIdFilter: {
      id: 'filter.sampleExternalIdFilter',
      defaultMessage: 'Sample ID includes: {sampleExternalId}',
    },
    matchedFilter: { id: 'filter.matchedFilter', defaultMessage: 'Matched' },
    notMatchedFilter: { id: 'filter.notMatchedFilter', defaultMessage: 'Not Matched' },
  }),
}

export default messages
