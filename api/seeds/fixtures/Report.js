const mtb_detected_rr_detected = {
  name: 'MTB Detected RR Detected',
  description: 'Contains all MTB Detected/RR Detected cases',
  i18nKey: 'MTB_Detected_RR_Detected',
  externalId: 'mtb_detected_rr_detected',
  fileName: 'MTB_Detected_RR_Detected',
  sheets: [
    {
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

const critical_errors_by_device = {
  name: 'Critical Errors By Device',
  description:
    'Includes a list of devices that had at least 2 critical errors',
  i18nKey: 'Critical_Errors_By_Device',
  externalId: 'critical_errors_by_device',
  fileName: 'DevicesWithErrors',
  sheets: [
    {
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

const rif_resistance_rate = {
  name: 'RIF Resistance Rate (%positive results)',
  description:
    'Listing RIF Resistance Rate for all facilities, ranked highest to lowest',
  i18nKey: 'RIF_Resistance_Rate',
  externalId: 'rif_resistance_rate',
  fileName: 'RifResistanceRate',
  sheets: [
    {
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

const results_hiv_not_suppressed = {
  name: 'Results with HIV Not Suppressed',
  description: 'All HIV results where the virus is not suppressed',
  i18nKey: 'Results_HIV_Not_Suppressed',
  externalId: 'results_hiv_not_suppressed',
  fileName: 'HIVNotSuppressed',
  sheets: [
    {
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

module.exports = {
  results_hiv_not_suppressed,
  rif_resistance_rate,
  critical_errors_by_device,
  mtb_detected_rr_detected,
  fixture: [results_hiv_not_suppressed, rif_resistance_rate, critical_errors_by_device, mtb_detected_rr_detected],
}