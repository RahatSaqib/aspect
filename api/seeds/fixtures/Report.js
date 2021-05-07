const mtbDetectedRRDetected = {
  name: 'MTB Detected RR Detected',
  description: 'Contains all MTB Detected/RR Detected cases',
  i18nKey: 'MTB_Detected_RR_Detected',
  i18nKeyDescription: 'MTB_Detected_RR_Detected_description',
  externalId: 'mtb_detected_rr_detected',
  fileName: 'MTB_Detected_RR_Detected',
  sortOrder: 0,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/service',
      functionName: 'getResultsForReport',
      query: {
        sortCol: 'endedOn',
        sortDir: 'desc',
        assayId: 'GxMtbRif',
        resultCategoryId: 'Detected',
        resultCategory2Id: 'Detected',
      },
    },
  ],
}

const criticalErrorsByDevice = {
  name: 'Critical Errors By Device',
  description: 'Includes a list of devices that had at least 2 critical errors',
  i18nKey: 'Critical_Errors_By_Device',
  i18nKeyDescription: 'Critical_Errors_By_Device_description',
  externalId: 'critical_errors_by_device',
  fileName: 'DevicesWithErrors',
  sortOrder: 2,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/service',
      functionName: 'getDevicesForReport',
      query: {
        sortCol: 'name',
        sortDir: 'asc',
        hasResults: 1,
        assayId: 'GxMtbRif',
      },
    },
  ],
}

const rifResistanceRate = {
  name: 'RIF Resistance Rate (%positive results)',
  description:
    'Listing RIF Resistance Rate for all facilities, ranked highest to lowest',
  i18nKey: 'RIF_Resistance_Rate',
  externalId: 'rif_resistance_rate',
  i18nKeyDescription: 'RIF_Resistance_Rate_description',
  fileName: 'RifResistanceRate',
  sortOrder: 3,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/service',
      functionName: 'getDevicesForRifResistanceReport',
      query: {
        sortCol: 'name',
        sortDir: 'asc',
        hasResults: 1,
        assayId: 'GxMtbRif',
        resultCategoryId: 'Detected',
        resultCategory2Id: 'Detected',
      },
    },
  ],
}

const resultsHivNotSuppressed = {
  name: 'Results with HIV Not Suppressed',
  description: 'All HIV results where the virus is not suppressed',
  i18nKey: 'Results_HIV_Not_Suppressed',
  externalId: 'results_hiv_not_suppressed',
  i18nKeyDescription: 'results_hiv_not_suppressed_description',
  fileName: 'HIVNotSuppressed',
  sortOrder: 4,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/service',
      functionName: 'getResultsForReport',
      query: {
        sortCol: 'endedOn',
        sortDir: 'desc',
        assayId: 'GxHiv1Vl',
        resultCategoryId: 'MoreThan1000',
      },
    },
  ],
}

const deviceActivity = {
  name: 'Device Activity',
  description:
    'This report shows the activity of the devices during the selected period of time, breaking it down by months (By default last 12 months), and all the tests performed during the last year.',
  i18nKey: 'deviceActivityReport',
  externalId: 'device_activity',
  i18nKeyDescription: 'device_activity_description',
  fileName: 'deviceActivity',
  sortOrder: 5,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/serviceReports',
      functionName: 'getDeviceActivityReport',
      query: {
        sortCol: 'name',
        sortDir: 'asc',
        hasResults: 1,
      },
    },
  ],
}
const deviceCapacityReport = {
  name: 'Device Capacity',
  description:
    'This report shows the utilization rate of the devices during the selected period of time, breaking it down by months (By default last 12 months), and all the tests performed during the last year.',
  i18nKey: 'deviceCapacityReport',
  externalId: 'device_capacity',
  i18nKeyDescription: 'device_capacity_description',
  fileName: 'deviceCapacity',
  sortOrder: 7,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/serviceReports',
      functionName: 'getDeviceCapacityReport',
      query: {
        sortCol: 'name',
        sortDir: 'asc',
        hasResults: 1,
      },
    },
  ],
}
const moduleSwaps = {
  name: 'Module Swaps',
  description:
    'This report shows all module swaps in devices. The report will show you by default the last 12 months',
  i18nKey: 'moduleSwapsReport',
  externalId: 'module_swaps',
  fileName: 'moduleSwaps',
  i18nKeyDescription: 'moduleSwapsReport_description',
  sortOrder: 6,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/serviceReports',
      functionName: 'getModuleSwapsReport',
      query: {
        sortCol: 'deviceName',
        sortDir: 'asc',
        hasResults: 1,
      },
    },
  ],
}

const deviceCalibrationReport = {
  name: 'Device Calibration Report',
  description:
    'All devices along with the last calibration date and when next calibration is due',
  i18nKey: 'Device_Calibration_Report',
  i18nKeyDescription: 'Device_Calibration_Report_description',
  externalId: 'device_calibration_report',
  fileName: 'DeviceCalibrationReport',
  sortOrder: 5,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/service',
      functionName: 'getDeviceCalibrationsForReport',
      query: {
        hasResults: 1,
        sortCol: 'name',
        sortDir: 'asc',
      },
    },
  ],
}

const geneXpertIssues = {
  name: 'GeneXpert Issues',
  description: 'This report shows all issues that apply to GeneXpert devices',
  i18nKey: 'geneXpertIssues',
  i18nKeyDescription: 'geneXpertIssues_description',
  externalId: 'genexpert_issues',
  fileName: 'geneXpertIssues',
  sortOrder: 7,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/serviceReports',
      functionName: 'getGeneXpertIssuesReport',
      query: {
        sortCol: 'triggeredOn',
        sortDir: 'asc',
        hasResults: 1,
      },
    },
  ],
}

module.exports = {
  resultsHivNotSuppressed,
  rifResistanceRate,
  criticalErrorsByDevice,
  mtbDetectedRRDetected,
  deviceActivity,
  moduleSwaps,
  deviceCapacityReport,
  deviceCalibrationReport,
  geneXpertIssues,
  fixture: [
    mtbDetectedRRDetected,
    resultsHivNotSuppressed,
    rifResistanceRate,
    criticalErrorsByDevice,
    deviceActivity,
    moduleSwaps,
    deviceCalibrationReport,
    deviceCapacityReport,
    geneXpertIssues,
  ],
}
