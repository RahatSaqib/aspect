const { allAssayToId, allResultCategoryToId } = require('../../src/shared/dictionary')

async function getBaseReports() {
  const assayIds = await allAssayToId()
  const resultCategoryIds = await allResultCategoryToId()

  return [
    {
      name: 'MTB Detected RR Detected',
      description: 'Contains all MTB Detected/RR Detected cases',
      i18nKey: 'MTB_Detected_RR_Detected',
      externalId: 'mtb_detected_rr_detected',
      fileName: 'MTB_Detected_RR_Detected',
      validations: [],
      sheets: [
        {
          moduleName: 'result/service',
          functionName: 'getResultsForReport',
          query: {
            sortCol: 'endedOn',
            sortDir: 'desc',
            assayId: assayIds.GxMtbRif,
            resultCategoryId: resultCategoryIds.Detected,
            resultCategory2Id: resultCategoryIds.Detected,
          },
        },
      ],
    },
    {
      name: 'Critical Errors By Device',
      description: 'Includes a list of devices that had at least 1 critical errors',
      i18nKey: 'Critical_Errors_By_Device',
      externalId: 'critical_errors_by_device',
      fileName: 'DevicesWithErrors',
      validations: [],
      sheets: [
        {
          moduleName: 'device/service',
          functionName: 'getDevicesForReport',
          query: {
            sortCol: 'name',
            sortDir: 'asc',
            hasResults: 1,
            assayId: assayIds.GxMtbRif,
          },
        },
        {
          moduleName: 'device/serviceReports',
          functionName: 'getErrorsByDevicesReport',
          query: {
            hasResults: 1,
            sortCol: 'deviceName',
            sortDir: 'asc',
            avoidStreaming: true,
          },
        },
      ],
    },
    {
      name: 'RIF Resistance Rate (%positive results)',
      description: 'Listing RIF Resistance Rate for all facilities, ranked highest to lowest',
      i18nKey: 'RIF_Resistance_Rate',
      externalId: 'rif_resistance_rate',
      fileName: 'RifResistanceRate',
      validations: [],
      sheets: [
        {
          moduleName: 'device/service',
          functionName: 'getDevicesForRifResistanceReport',
          query: {
            sortCol: 'name',
            sortDir: 'asc',
            hasResults: 1,
            assayId: assayIds.GxMtbRif,
            resultCategoryId: resultCategoryIds.Detected,
            resultCategory2Id: resultCategoryIds.Detected,
          },
        },
      ],
    },
    {
      name: 'Results with HIV Not Suppressed',
      description: 'All HIV results where the virus is not suppressed',
      i18nKey: 'Results_HIV_Not_Suppressed',
      externalId: 'results_hiv_not_suppressed',
      fileName: 'HIVNotSuppressed',
      validations: [],
      sheets: [
        {
          moduleName: 'result/service',
          functionName: 'getResultsForReport',
          query: {
            sortCol: 'endedOn',
            sortDir: 'desc',
            assayId: assayIds.GxHiv1Vl,
            resultCategoryId: resultCategoryIds.MoreThan1000,
          },
        },
      ],
    },
  ]
}

module.exports = {
  getBaseReports,
}
