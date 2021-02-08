const mtbDetectedRRDetected = {
  name: 'MTB Detected RR Detected',
  description: 'Contains all MTB Detected/RR Detected cases',
  i18nKey: 'MTB_Detected_RR_Detected',
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

const deviceCalibrationReport = {
  name: 'Device Calibration Report',
  description:
    'All devices along with the last calibration date and when next calibration is due',
  i18nKey: 'Device_Calibration_Report',
  externalId: 'device_calibration_report',
  fileName: 'DeviceCalibrationReport',
  sortOrder: 5,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/service',
      functionName: 'getDeviceCalibrationsForReport',
      query: {
        sortCol: 'name',
        sortDir: 'asc',
      },
    },
  ],
}

module.exports = {
  resultsHivNotSuppressed,
  rifResistanceRate,
  criticalErrorsByDevice,
  mtbDetectedRRDetected,
  deviceCalibrationReport,
}
