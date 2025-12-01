const _ = require('lodash')
const { endOfMonth, startOfMonth, subMonths } = require('date-fns')
const dateFormat = require('date-fns/format')

const { getUser } = require('../../auth/service')
const { addConstraints, getConstraints } = require('../../auth/constraints')
const { knex, filterParams, filterDateRangeParams, sortPageParams } = require('../../db')
const { getDeviceInfo } = require('../../device/common/db')
const { getDatesFromQuery } = require('../../shared/date')
const { allAssayToId, allResultCategoryToId } = require('../../shared/dictionary')
const { convertCsvToArrayOfNumbers } = require('../../shared/string')
const getPositiveCategoriesExternalIds = require('../../resultCategory/service')
const { createFormObject } = require('../../forms/service')

/**
 * **************************************
 * helpers
 * **************************************
 */
const presumptiveTbCases = ['Presumptive Pulmonary Smear Negative TB Cases', 'Presumptive TB']
const presumptiveDrTbCases = [
  'Failures of Category I',
  'Non converters of Category I',
  'Failures of Retreatment',
  'Non converters of Retreatment',
  'Relapses',
  'Treatment after loss to follow up',
  'Close contacts of DR TB patient with symptoms',
  'HIV infected person, with TB S/S',
  'Others - Pulmonary, clinically diagnosed',
  'Others - Extra Pulmonary',
  'Others - Pulmonary, Bacteriologically Confirmed',
]
/**
 * see `api/src/forms/formsDefinition/CustomFields_Bangladesh_Mtb.json` (and other)
 * for custom fields stored in `r.patientData`
 */
// ----------------
const typeOfPatient = value => `
  IFNULL(r.patientData->>'$.TypeOfPatient', '') = '${value}'
`
// ----------------
const patientHistory = value => `
  IFNULL(r.patientData->>'$.PatientHistory', '') = '${value}'
`
// ----------------
const patientRetreatment = value => `
  IFNULL(r.patientData->>'$.PatientRetreatment', '') = '${value}'
`
// ----------------
const counter = (id, condition) =>
  knex.raw(`
      DISTINCT
      CASE
        WHEN ${condition}
        THEN ${id}
        ELSE null
      END
    `)
// ----------------
const inTypeOfPatient = (typeOfPatientValues, moreConditions) => {
  const typeOfPatient = _.trim(JSON.stringify(typeOfPatientValues), '[ ]')
  let condition = `
    IFNULL(r.patientData->>'$.TypeOfPatient', '') IN (${typeOfPatient})
  `
  if (moreConditions) {
    condition += `
      and
      ${moreConditions}
    `
  }
  return counter('r.id', condition)
}
// ----------------
const andByHistory = (typeOfPatientValue, patientHistoryValue, resultCategoryCondition, assayCondition) => {
  let condition = `
   ${typeOfPatient(typeOfPatientValue)}
  `
  if (patientHistoryValue) condition += ` and ${patientHistory(patientHistoryValue)} `

  if (resultCategoryCondition) condition += ` and ${resultCategoryCondition} `

  if (assayCondition) condition += ` and ${assayCondition} `

  return counter('r.id', condition)
}
// ----------------
const andByRetreatment = (typeOfPatientValue, patientRetreatmentValue, resultCategoryCondition, assayCondition) => {
  let condition = `
    ${typeOfPatient(typeOfPatientValue)}
  `
  if (patientRetreatmentValue) condition += ` and ${patientRetreatment(patientRetreatmentValue)} `

  if (resultCategoryCondition) condition += ` and ${resultCategoryCondition} `

  if (assayCondition) condition += ` and ${assayCondition} `

  return counter('r.id', condition)
}
// ---------------------------------------------------------------------------
const reportDrTb10ABaseQuery = async (auth, query, groupBySite = false) => {
  const dataConstraints = await getConstraints(auth.credentials)

  const dates = getDatesFromQuery(query)
  let { dateFrom } = dates
  const { dateTo } = dates
  if (dateFrom >= dateTo) {
    dateFrom = subMonths(dateTo, 1)
  }
  // /**
  //  * Make sure minDate and maxDate are Date object - needed to let knex correctly
  //  * format value for MySql format - i.e. UTC as 'yyyy-MM-dd hh:mm:ss' (without timezone offset)
  //  */
  query.minDate = query.minDate instanceof Date ? query.minDate : new Date(query.minDate)
  query.maxDate = query.maxDate instanceof Date ? query.maxDate : new Date(query.maxDate)

  const assayIds = await allAssayToId()
  const resultCategoryIds = await allResultCategoryToId()
  const positiveResultCategories = _.values(_.pick(resultCategoryIds, getPositiveCategoriesExternalIds()))

  // ----------------
  const mtbDetected = `
    r.resultCategory1 IN (${positiveResultCategories})
  `
  // ----------------
  const mtbRifDetected = `
    r.resultCategory1 IN (${positiveResultCategories})
    and
    r.resultCategory2 IN (${positiveResultCategories})
  `

  const assayMtb = `r.assayId in (${assayIds.GxMtbRif}, ${assayIds.GxMtbRifUltra})`
  const assayXdr = `r.assayId = ${assayIds.GxMtbXdr}`

  const excludeNonResultCategories = `r.resultCategory1 NOT IN (
                      ${resultCategoryIds.Invalid},
                      ${resultCategoryIds.Error},
                      ${resultCategoryIds.NoResult})`

  return {
    drTb10AData: knex
      .with(
        'modulesActive',
        knex('Result as r')
          .leftOuterJoin('Site as st', 'st.id', 'r.siteId')
          .select(
            'r.deviceId',
            knex.raw(
              `COUNT(DISTINCT CONCAT(r.instrumentSerial, '-', CAST(REGEXP_SUBSTR(r.moduleName, '[0-9]+') AS UNSIGNED))) AS cntModulesActive`
            )
          )
          .modify(filterDateRangeParams, query, 'r.endedOn')
          .modify(filterParams, query, {
            siteName: 'st.name',
          })
          .groupBy('r.deviceId')
      )
      .select(
        'r.deviceId',
        knex.raw(`r.patientData->>'$.SampleType' as sampleType`),
        knex.raw(`GROUP_CONCAT(DISTINCT r.siteId) as siteIds`),
        knex.raw(`d.moduleBayCapacity as cntModules`),
        knex.raw('modulesActive.cntModulesActive') // Use precomputed `cntModulesActive` from CTE
      )
      .from('Result as r')
      .innerJoin('Device as d', 'r.deviceId', 'd.id')
      .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
      .innerJoin('Assay as a', 'r.assayId', 'a.id')
      .leftOuterJoin('Site as s', 's.id', 'r.siteId')
      .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
      .leftJoin('State as st', 'st.id', 'g.stateId')
      .leftJoin('Lga as lga', 'lga.id', 'g.lgaId')
      .leftJoin('ResultCategoryAssay as rca1', function () {
        this.on('r.assayId', 'rca1.assayId').andOn('r.resultCategory1', 'rca1.resultCategoryId')
      })
      .leftJoin('ResultCategoryAssay as rca2', function () {
        this.on('r.assayId', 'rca2.assayId').andOn('r.resultCategory2', 'rca2.resultCategoryId')
      })
      .leftJoin('modulesActive', 'r.deviceId', 'modulesActive.deviceId') // Use CTE to avoid double scan of the Result table

      /**
       * better and faster to use joins with Sample/SampleType tables to get sample types for
       * 'Pulmonary` (Sputum) or 'Stool'. But now we have all Sample.sampleTypeId empty,
       * and because of that read sample type directly from
       * r.patientData->>'$.SampleType'
       */
      // .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
      // .leftJoin('SampleType as stp', 'sp.sampleTypeId', 'stp.id')
      .whereIn('a.id', [assayIds.GxMtbRif, assayIds.GxMtbRifUltra, assayIds.GxMtbXdr])
      .modify(addConstraints, dataConstraints, {
        device: 'd',
        site: 's',
        geography: 'g',
        assay: 'a',
        result: 'r',
      })
      .modify(filterDateRangeParams, query, 'r.endedOn')
      .modify(filterParams, query, {
        countryId: 'g.countryId',
        stateId: 'g.stateId',
        lgaId: 'g.lgaId',
        siteName: 's.name',
      })
      .select(
        'r.deviceId',
        knex.raw(`r.patientData->>'$.SampleType' as sampleType`),
        knex.raw(`GROUP_CONCAT(DISTINCT r.siteId) as siteIds`),
        knex.raw(`d.moduleBayCapacity as cntModules`),
        knex.raw('modulesActive.cntModulesActive'), // Use precomputed `cntModulesActive` from CTE
        's.name as siteName',
        'st.name as stateName',
        'lga.name as lgaName',
        /**
         * Notice that we below group by `deviceId`
         * only because we need to count number of modules
         * for each device
         */
        'd.moduleBayCapacity as cntModules',
        'modulesActive.cntModulesActive' // Use precomputed `cntModulesActive`
      )
      .modify(qb => {
        if (groupBySite) qb.groupBy('r.siteId', 'sampleType')
        else qb.groupBy('r.deviceId', 'sampleType')
      })

      /**
       * get total results per each device per period
       *
       * for Block 1,2,3 - see file
       * `api/src/forms/formsDefinition/CustomFields_Bangladesh_Mtb.json`
       * for details about used custom fields
       */
      .count({
        cntAll: knex.raw('DISTINCT r.id'),
        /**
         * Block 1
         */
        cnt_Presumptive_TB_Cases_Invalid_Mtb: inTypeOfPatient(
          presumptiveTbCases,
          `r.resultCategory1 = ${resultCategoryIds.Invalid}
       and
       ${assayMtb}
      `
        ),
        cnt_Presumptive_TB_Cases_Invalid_Xdr: inTypeOfPatient(
          presumptiveTbCases,
          `r.resultCategory1 = ${resultCategoryIds.Invalid}
       and
       ${assayXdr}
      `
        ),
        cnt_Presumptive_TB_Cases_NoResult_Mtb: inTypeOfPatient(
          presumptiveTbCases,
          `r.resultCategory1 = ${resultCategoryIds.NoResult}
       and
       ${assayMtb}
      `
        ),
        cnt_Presumptive_TB_Cases_NoResult_Xdr: inTypeOfPatient(
          presumptiveTbCases,
          `r.resultCategory1 = ${resultCategoryIds.NoResult}
       and
       ${assayXdr}
      `
        ),
        cnt_Presumptive_TB_Cases_Error_Mtb: inTypeOfPatient(
          presumptiveTbCases,
          `r.resultCategory1 = ${resultCategoryIds.Error}
       and
       ${assayMtb}
      `
        ),
        cnt_Presumptive_TB_Cases_Error_Xdr: inTypeOfPatient(
          presumptiveTbCases,
          `r.resultCategory1 = ${resultCategoryIds.Error}
       and
       ${assayXdr}
      `
        ),

        cnt_Presumptive_DR_TB_Cases_Invalid_Mtb: inTypeOfPatient(
          presumptiveDrTbCases,
          `r.resultCategory1 = ${resultCategoryIds.Invalid}
       and
       ${assayMtb}
      `
        ),
        cnt_Presumptive_DR_TB_Cases_Invalid_Xdr: inTypeOfPatient(
          presumptiveDrTbCases,
          `r.resultCategory1 = ${resultCategoryIds.Invalid}
       and
       ${assayXdr}
      `
        ),
        cnt_Presumptive_DR_TB_Cases_NoResult_Mtb: inTypeOfPatient(
          presumptiveDrTbCases,
          `r.resultCategory1 = ${resultCategoryIds.NoResult}
       and
       ${assayMtb}
      `
        ),
        cnt_Presumptive_DR_TB_Cases_NoResult_Xdr: inTypeOfPatient(
          presumptiveDrTbCases,
          `r.resultCategory1 = ${resultCategoryIds.NoResult}
       and
       ${assayXdr}
      `
        ),
        cnt_Presumptive_DR_TB_Cases_Error_Mtb: inTypeOfPatient(
          presumptiveDrTbCases,
          `r.resultCategory1 = ${resultCategoryIds.Error}
       and
       ${assayMtb}
      `
        ),
        cnt_Presumptive_DR_TB_Cases_Error_Xdr: inTypeOfPatient(
          presumptiveDrTbCases,
          `r.resultCategory1 = ${resultCategoryIds.Error}
       and
       ${assayXdr}
      `
        ),

        cnt_Presumptive_DR_TB_Cases_Invalid: inTypeOfPatient(
          presumptiveDrTbCases,
          `r.resultCategory1 = ${resultCategoryIds.Invalid}`
        ),
        cnt_Presumptive_DR_TB_Cases_NoResult: inTypeOfPatient(
          presumptiveDrTbCases,
          `r.resultCategory1 = ${resultCategoryIds.NoResult}`
        ),
        cnt_Presumptive_DR_TB_Cases_Error: inTypeOfPatient(
          presumptiveDrTbCases,
          `r.resultCategory1 = ${resultCategoryIds.Error}`
        ),
        cnt_Total_Cases_Invalid: counter(
          'r.id',
          `
      r.resultCategory1 = ${resultCategoryIds.Invalid}`
        ),
        cnt_Total_Cases_NoResult: counter(
          'r.id',
          `
      r.resultCategory1 = ${resultCategoryIds.NoResult}`
        ),
        cnt_Total_Cases_Error: counter(
          'r.id',
          `
      r.resultCategory1 = ${resultCategoryIds.Error}`
        ),

        cnt_Presumptive_TB_Cases_MtbDetectedRifIndeterminate: inTypeOfPatient(
          presumptiveTbCases,
          `
      r.resultCategory1 = ${resultCategoryIds.Detected}
      and
      r.resultCategory2 = ${resultCategoryIds.Indeterminate}
    `
        ),
        cnt_Presumptive_DR_TB_Cases_MtbDetectedRifIndeterminate: inTypeOfPatient(
          presumptiveDrTbCases,
          `
      r.resultCategory1 = ${resultCategoryIds.Detected}
      and
      r.resultCategory2 = ${resultCategoryIds.Indeterminate}
    `
        ),
        cnt_Presumptive_TB_Cases_MtbDetectedRifTraces: inTypeOfPatient(
          presumptiveTbCases,
          `
          r.resultCategory1 = ${resultCategoryIds['Trace Detected']}`
        ),
        cnt_Presumptive_DR_TB_Cases_MtbDetectedRifTraces: inTypeOfPatient(
          presumptiveDrTbCases,
          `
          r.resultCategory1 = ${resultCategoryIds['Trace Detected']}`
        ),
        cnt_Total_MtbDetectedRifNotDetected: counter(
          'r.id',
          `
      r.resultCategory1 IN (${positiveResultCategories})
      and
      r.resultCategory2 = ${resultCategoryIds.NotDetected}
    `
        ),
        cnt_Total_MtbDetectedRifDetected: counter(
          'r.id',
          `
      r.resultCategory1 IN (${positiveResultCategories})
      and
      r.resultCategory2 IN (${positiveResultCategories})
    `
        ),
        cnt_Total_MtbDetectedRifIndeterminate: counter(
          'r.id',
          `
      r.resultCategory1 IN (${positiveResultCategories})
      and
      r.resultCategory2 = ${resultCategoryIds.Indeterminate}
    `
        ),
        cnt_Total_MtbNotDetected: counter(
          'r.id',
          `
      r.resultCategory1 = ${resultCategoryIds.NotDetected}
    `
        ),
        /**
         * ****************************************
         * Block 2 - Type of Patient : Presumptive TB Cases
         * ****************************************
         */
        /** -----------------
         * Patient History = Unknown History
         */

        cnt_TypeOfPatient_Presumptive_TB_Cases_UnknownHistory_all: andByHistory(
          'Presumptive TB',
          'Unknown history',
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_Presumptive_TB_Cases_UnknownHistory_Mtb: andByHistory(
          'Presumptive TB',
          'Unknown history',
          mtbDetected,
          assayMtb
        ),
        cnt_TypeOfPatient_Presumptive_TB_Cases_UnknownHistory_MtbRif: andByHistory(
          'Presumptive TB',
          'Unknown history',
          mtbRifDetected,
          assayMtb
        ),
        /** -----------------
         * Patient History = New
         */
        cnt_TypeOfPatient_Presumptive_TB_Cases_New_all: andByHistory(
          'Presumptive TB',
          'New',
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_Presumptive_TB_Cases_New_Mtb: andByHistory('Presumptive TB', 'New', mtbDetected, assayMtb),
        cnt_TypeOfPatient_Presumptive_TB_Cases_New_MtbRif: andByHistory(
          'Presumptive TB',
          'New',
          mtbRifDetected,
          assayMtb
        ),
        /**
         * ****************************************
         * Block 2 - Type of Patient : Presumptive DR TB Cases
         * ****************************************
         */
        /** -----------------
         * Column (3) - remain positive at month 5 or later and smear negative patients who become smear positive at month 2
         */
        cnt_TypeOfPatient_Column_3_all: andByRetreatment(
          'Failures of Category I',
          null,
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_3_Mtb: andByRetreatment(
          'Failures of Category I',
          null,
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_3_MtbRif: andByRetreatment(
          'Failures of Category I',
          null,
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        /** -----------------
         * Column (4) - remain positive at month 5 or later
         */
        cnt_TypeOfPatient_Column_4_all: andByRetreatment(
          'Failures of Retreatment',
          null,
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_4_Mtb: andByRetreatment(
          'Failures of Retreatment',
          null,
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_4_MtbRif: andByRetreatment(
          'Failures of Retreatment',
          null,
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        /** -----------------
         * Column (5) - remain positive at month 2
         */
        cnt_TypeOfPatient_Column_5_all: andByRetreatment(
          'Non converters of Category I',
          null,
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_5_Mtb: andByRetreatment(
          'Non converters of Category I',
          null,
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_5_MtbRif: andByRetreatment(
          'Non converters of Category I',
          null,
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        /** -----------------
         * Column (6) - remain positive at month 3
         */
        cnt_TypeOfPatient_Column_6_all: andByRetreatment(
          'Non converters of Retreatment',
          null,
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_6_Mtb: andByRetreatment(
          'Non converters of Retreatment',
          null,
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_6_MtbRif: andByRetreatment(
          'Non converters of Retreatment',
          null,
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        /** -----------------
         * Column (7) - Relapses (CAT I)
         */
        cnt_TypeOfPatient_Column_7_all: andByRetreatment(
          'Relapses',
          'Category I',
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_7_Mtb: andByRetreatment(
          'Relapses',
          'Category I',
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_7_MtbRif: andByRetreatment(
          'Relapses',
          'Category I',
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        /** -----------------
         * Column (8) - Relapses (CAT II)
         */
        cnt_TypeOfPatient_Column_8_all: andByRetreatment(
          'Relapses',
          'Retreatment',
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_8_Mtb: andByRetreatment(
          'Relapses',
          'Retreatment',
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_8_MtbRif: andByRetreatment(
          'Relapses',
          'Retreatment',
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        /** -----------------
         * Column (9) - Treatment after loss to follow up (CAT I)
         */
        cnt_TypeOfPatient_Column_9_all: andByRetreatment(
          'Treatment after loss to follow up',
          'Category I',
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_9_Mtb: andByRetreatment(
          'Treatment after loss to follow up',
          'Category I',
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_9_MtbRif: andByRetreatment(
          'Treatment after loss to follow up',
          'Category I',
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        /** -----------------
         * Column (10) - Treatment after loss to follow up (CAT II)
         */
        cnt_TypeOfPatient_Column_10_all: andByRetreatment(
          'Treatment after loss to follow up',
          'Retreatment',
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_10_Mtb: andByRetreatment(
          'Treatment after loss to follow up',
          'Retreatment',
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_10_MtbRif: andByRetreatment(
          'Treatment after loss to follow up',
          'Retreatment',
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        /** -----------------
         * Column (11) - Close contacts of DR TB patient with symptoms
         */
        cnt_TypeOfPatient_Column_11_all_UnknownHistory: andByHistory(
          'Close contacts of DR TB patient with symptoms',
          'Unknown history',
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_11_all_New: andByHistory(
          'Close contacts of DR TB patient with symptoms',
          'New',
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_11_all_PrevTreated: andByHistory(
          'Close contacts of DR TB patient with symptoms',
          'Previously treated',
          excludeNonResultCategories,
          assayMtb
        ),

        cnt_TypeOfPatient_Column_11_Mtb_UnknownHistory: andByHistory(
          'Close contacts of DR TB patient with symptoms',
          'Unknown history',
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_11_Mtb_New: andByHistory(
          'Close contacts of DR TB patient with symptoms',
          'New',
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_11_Mtb_PrevTreated: andByHistory(
          'Close contacts of DR TB patient with symptoms',
          'Previously treated',
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),

        cnt_TypeOfPatient_Column_11_MtbRif_UnknownHistory: andByHistory(
          'Close contacts of DR TB patient with symptoms',
          'Unknown history',
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_11_MtbRif_New: andByHistory(
          'Close contacts of DR TB patient with symptoms',
          'New',
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_11_MtbRif_PrevTreated: andByHistory(
          'Close contacts of DR TB patient with symptoms',
          'Previously treated',
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        /** -----------------
         * Column (12) - HIV infected person with TB S/S
         */
        cnt_TypeOfPatient_Column_12_all_UnknownHistory: andByHistory(
          'HIV infected person, with TB S/S',
          'Unknown history',
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_12_all_New: andByHistory(
          'HIV infected person, with TB S/S',
          'New',
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_12_all_PrevTreated: andByHistory(
          'HIV infected person, with TB S/S',
          'Previously treated',
          excludeNonResultCategories,
          assayMtb
        ),

        cnt_TypeOfPatient_Column_12_Mtb_UnknownHistory: andByHistory(
          'HIV infected person, with TB S/S',
          'Unknown history',
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_12_Mtb_New: andByHistory(
          'HIV infected person, with TB S/S',
          'New',
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_12_Mtb_PrevTreated: andByHistory(
          'HIV infected person, with TB S/S',
          'Previously treated',
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),

        cnt_TypeOfPatient_Column_12_MtbRif_UnknownHistory: andByHistory(
          'HIV infected person, with TB S/S',
          'Unknown history',
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_12_MtbRif_New: andByHistory(
          'HIV infected person, with TB S/S',
          'New',
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_Column_12_MtbRif_PrevTreated: andByHistory(
          'HIV infected person, with TB S/S',
          'Previously treated',
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),

        /**
         * ****************************************
         * Block 3 - Number of Presumptive smear negative TB cases
         * ****************************************
         */
        // ------------
        cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_UnknownHistory_all: andByHistory(
          'Presumptive Pulmonary Smear Negative TB Cases',
          'Unknown history',
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_UnknownHistory_Mtb: andByHistory(
          'Presumptive Pulmonary Smear Negative TB Cases',
          'Unknown history',
          mtbDetected,
          assayMtb
        ),
        cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_UnknownHistory_MtbRif: andByHistory(
          'Presumptive Pulmonary Smear Negative TB Cases',
          'Unknown history',
          mtbRifDetected,
          assayMtb
        ),
        // ------------
        cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_New_all: andByHistory(
          'Presumptive Pulmonary Smear Negative TB Cases',
          'New',
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_New_Mtb: andByHistory(
          'Presumptive Pulmonary Smear Negative TB Cases',
          'New',
          mtbDetected,
          assayMtb
        ),
        cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_New_MtbRif: andByHistory(
          'Presumptive Pulmonary Smear Negative TB Cases',
          'New',
          mtbRifDetected,
          assayMtb
        ),
        // ------------
        cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_PrevTreated_all: andByHistory(
          'Presumptive Pulmonary Smear Negative TB Cases',
          'Previously treated',
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_PrevTreated_Mtb: andByHistory(
          'Presumptive Pulmonary Smear Negative TB Cases',
          'Previously treated',
          mtbDetected,
          assayMtb
        ),
        cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_PrevTreated_MtbRif: andByHistory(
          'Presumptive Pulmonary Smear Negative TB Cases',
          'Previously treated',
          mtbRifDetected,
          assayMtb
        ),
        /**
         * ****************************************
         * Block 3 - *Others (Specify)
         * ****************************************
         */
        /**
         * Patient History = Unknown History
         */
        // ------------
        cnt_TypeOfPatient_OtherPulmClinDiag_UnknownHistory_all: andByHistory(
          'Others - Pulmonary, clinically diagnosed',
          'Unknown history',
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_OtherPulmClinDiag_UnknownHistory_Mtb: andByHistory(
          'Others - Pulmonary, clinically diagnosed',
          'Unknown history',
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_OtherPulmClinDiag_UnknownHistory_MtbRif: andByHistory(
          'Others - Pulmonary, clinically diagnosed',
          'Unknown history',
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        // ------------
        cnt_TypeOfPatient_OtherExtraPulm_UnknownHistory_all: andByHistory(
          'Others - Extra Pulmonary',
          'Unknown history',
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_OtherExtraPulm_UnknownHistory_Mtb: andByHistory(
          'Others - Extra Pulmonary',
          'Unknown history',
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_OtherExtraPulm_UnknownHistory_MtbRif: andByHistory(
          'Others - Extra Pulmonary',
          'Unknown history',
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        // ------------
        cnt_TypeOfPatient_OtherPulmBactConf_UnknownHistory_all: andByHistory(
          'Others - Pulmonary, Bacteriologically Confirmed',
          'Unknown history',
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_OtherPulmBactConf_UnknownHistory_Mtb: andByHistory(
          'Others - Pulmonary, Bacteriologically Confirmed',
          'Unknown history',
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_OtherPulmBactConf_UnknownHistory_MtbRif: andByHistory(
          'Others - Pulmonary, Bacteriologically Confirmed',
          'Unknown history',
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),

        /**
         * Patient History = New
         */
        // ------------
        cnt_TypeOfPatient_OtherPulmClinDiag_New_all: andByHistory(
          'Others - Pulmonary, clinically diagnosed',
          'New',
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_OtherPulmClinDiag_New_Mtb: andByHistory(
          'Others - Pulmonary, clinically diagnosed',
          'New',
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_OtherPulmClinDiag_New_MtbRif: andByHistory(
          'Others - Pulmonary, clinically diagnosed',
          'New',
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        // ------------
        cnt_TypeOfPatient_OtherExtraPulm_New_all: andByHistory(
          'Others - Extra Pulmonary',
          'New',
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_OtherExtraPulm_New_Mtb: andByHistory(
          'Others - Extra Pulmonary',
          'New',
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_OtherExtraPulm_New_MtbRif: andByHistory(
          'Others - Extra Pulmonary',
          'New',
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        // ------------
        cnt_TypeOfPatient_OtherPulmBactConf_New_all: andByHistory(
          'Others - Pulmonary, Bacteriologically Confirmed',
          'New',
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_OtherPulmBactConf_New_Mtb: andByHistory(
          'Others - Pulmonary, Bacteriologically Confirmed',
          'New',
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_OtherPulmBactConf_New_MtbRif: andByHistory(
          'Others - Pulmonary, Bacteriologically Confirmed',
          'New',
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        /**
         * Patient History = Previously treated
         */
        // ------------
        cnt_TypeOfPatient_OtherPulmClinDiag_Treated_all: andByHistory(
          'Others - Pulmonary, clinically diagnosed',
          'Previously treated',
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_OtherPulmClinDiag_Treated_Mtb: andByHistory(
          'Others - Pulmonary, clinically diagnosed',
          'Previously treated',
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_OtherPulmClinDiag_Treated_MtbRif: andByHistory(
          'Others - Pulmonary, clinically diagnosed',
          'Previously treated',
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        // ------------
        cnt_TypeOfPatient_OtherExtraPulm_Treated_all: andByHistory(
          'Others - Extra Pulmonary',
          'Previously treated',
          excludeNonResultCategories,
          assayMtb
        ),
        cnt_TypeOfPatient_OtherExtraPulm_Treated_Mtb: andByHistory(
          'Others - Extra Pulmonary',
          'Previously treated',
          `${mtbDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),
        cnt_TypeOfPatient_OtherExtraPulm_Treated_MtbRif: andByHistory(
          'Others - Extra Pulmonary',
          'Previously treated',
          `${mtbRifDetected} AND ${excludeNonResultCategories}`,
          assayMtb
        ),

        cnt_Xdr_Tested_From_Eligible: counter('r.id', `${assayXdr}`),
        /**
         * cnt_Xdr_Total_Tests is calculated in the code
         */
        // cnt_Xdr_Total_Tests: --> see func `getQueryForXdrCountsByReferringSiteIds` below
      }),
    getQueryForXdrCountsByReferringSiteIds: (siteIds, sampleType) =>
      knex('Result as r')
        /**
         * use same inner joins as in main query
         */
        .innerJoin('Device as d', 'r.deviceId', 'd.id')
        .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
        .innerJoin('Assay as a', 'r.assayId', 'a.id')
        /**
         * better and faster to use joins with Sample/SampleType tables to get sample types for
         * 'Pulmonary` (Sputum) or 'Stool'. But now we have all Sample.sampleTypeId empty,
         * and because of that - below we read sample type directly from
         * r.patientData->>'$.SampleType'
         */
        // .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
        // .leftJoin('SampleType as stp', 'sp.sampleTypeId', 'stp.id')
        /**
         * limit to only Xdr results
         */
        .where('a.id', assayIds.GxMtbXdr)
        /**
         * use only value of Date filter and skip all other filters and constraints
         * applied to main query `drTb10AData` above
         */
        .modify(filterDateRangeParams, query, 'r.endedOn')
        /**
         * condition is "referringSiteId should point
         * to our sites, but result's siteId should not be among our sites"
         */
        .whereIn('r.referringSiteId', siteIds)
        .whereNotIn('r.siteId', siteIds)
        .where(knex.raw(`r.patientData->>'$.SampleType' = '${sampleType}'`))
        .count({
          cnt_Xdr_Total_Tests: knex.raw(`DISTINCT r.id`),
        })
        .first(),
  }
}

// ---------------------------------------------------------------------------
/**
 * getDataForReportDrTb10A
 */
async function getDataForReportDrTb10A(auth, query, timezone, options) {
  const { sharedResults, nameOfSharedData } = options

  const { stateId, lgaId, siteName } = query
  const { userName, cell } = await resolveUserFromAuth(auth)
  const dates = getDatesFromQuery(query)
  let { dateFrom } = dates
  const { dateTo } = dates
  if (dateFrom >= dateTo) {
    dateFrom = subMonths(dateTo, 1)
  }
  const { drTb10AData, getQueryForXdrCountsByReferringSiteIds } = await reportDrTb10ABaseQuery(auth, query)
  // eslint-disable-next-line prefer-const
  let [data, deviceInfo] = await Promise.all([drTb10AData, getDeviceInfo(auth.credentials, query)])

  sharedResults[nameOfSharedData] = { data, deviceInfo }

  data = await getDataForSheet1or2(
    data,
    { userName, cell }, // current user props
    { stateId, lgaId, siteName }, // props from query
    {
      /**
       * 1st worksheet shows only `Pulmonary` and `Extra-pulmonary` sample types
       */
      sampleType: ['Pulmonary', 'Extra-pulmonary'],
      getQueryForXdrCountsByReferringSiteIds,
    }
  )
  data = { ...data, ...deviceInfo[0] }

  return {
    ok: true,
    data,
    alreadyCachedSharedData: true,
  }
}

// ---------------------------------------------------------------------------
async function getDataForSheet1or2(
  rawData,
  { userName, cell, phone, email },
  { stateId, lgaId, siteName },
  { sampleType, getQueryForXdrCountsByReferringSiteIds }
) {
  let item
  const [first] = rawData || []
  let propNames = []
  if (first) {
    item = {
      userName,
      cell,
      phone,
      email,
      devices: new Set(), // this is a temporal prop to collect distinct deviceId's
    }
    /**
     * prop names of all counters `cnt*`, i.e. all keys starting with `cnt`
     */
    propNames = _.keys(first).filter(key => key.startsWith('cnt'))
    propNames.forEach(propName => {
      item[propName] = 0
    })
  } else {
    item = {}
  }

  let allSiteIds = []
  _.forEach(
    rawData?.filter(it => sampleType.includes(it.sampleType)),
    ({ deviceId, siteIds, ...rest }) => {
      /**
       *
       */
      allSiteIds = [...allSiteIds, ...convertCsvToArrayOfNumbers(siteIds)]
      /**
       * Increment all counters for current deviceId
       */
      propNames.forEach(propName => {
        item[propName] += rest[propName]
      })
      /**
       * unique deviceId's
       */
      item.devices.add(deviceId)
    }
  )
  const uniqueDevices = new Set()

  // Calculate the total cntModulesActive across unique device IDs
  const totalActiveModules = rawData.reduce((sum, { deviceId, cntModulesActive }) => {
    if (!uniqueDevices.has(deviceId)) {
      uniqueDevices.add(deviceId)
      return sum + Number(cntModulesActive) // Add to sum only if deviceId is new
    }
    return sum
  }, 0)
  item.cntModulesActive = totalActiveModules

  /**
   * unique site id's
   */
  allSiteIds = [...new Set(allSiteIds)]

  /**
   * cnt_Xdr_Total_Tests = cnt_Xdr_Tested_From_Eligible + (cnt_Xdr_Total_Tests from other sites)
   */
  item.cnt_Xdr_Total_Tests = item.cnt_Xdr_Tested_From_Eligible || 0
  /**
   * get number of results from other sites which are referring sites in main query
   */
  if (!_.isEmpty(allSiteIds)) {
    const it = await getQueryForXdrCountsByReferringSiteIds(allSiteIds, sampleType)
    item.cnt_Xdr_Total_Tests += it?.cnt_Xdr_Total_Tests || 0
  }

  /**
   * Subtract invalid, no result, and error cases from cnt_Xdr_Total_Tests
   */
  const invalidNoResultErrorSum =
    (item.cnt_Presumptive_TB_Cases_Invalid_Xdr || 0) +
    (item.cnt_Presumptive_TB_Cases_NoResult_Xdr || 0) +
    (item.cnt_Presumptive_TB_Cases_Error_Xdr || 0) +
    (item.cnt_Presumptive_DR_TB_Cases_Invalid_Xdr || 0) +
    (item.cnt_Presumptive_DR_TB_Cases_NoResult_Xdr || 0) +
    (item.cnt_Presumptive_DR_TB_Cases_Error_Xdr || 0)

  item.cnt_Xdr_Total_Tests -= invalidNoResultErrorSum

  let data = item
  if (_.isNil(data)) data = {}
  /**
   * set `cntDevices` and remove temporal prop `devices`
   */
  if (!_.isEmpty(data)) {
    data.cntDevices = item.devices?.size || 0
  }
  /**
   * additional props
   */
  data.today = dateFormat(new Date(), 'dd-MM-yyyy')
  data.siteName = siteName || 'All'
  if (siteName) {
    ;[{ lgaName: data.lgaName, stateName: data.stateName }] = await knex('Site as s')
      .innerJoin('Geography as g', 's.geographyId', 'g.id')
      .leftJoin('State as st', 'g.stateId', 'st.id')
      .leftJoin('Lga as l', 'g.lgaId', 'l.id')
      .where('s.name', 'like', `%${siteName}%`)
      .select('l.name as lgaName', 'st.name as stateName')
    data.stateName = data.stateName || '?'
    data.lgaName = data.lgaName || '?'
  } else {
    data.stateName = 'All'
    data.lgaName = 'All'
  }
  if (stateId) {
    ;[{ name: data.stateName }] = await knex('State').where('id', stateId).select('name')
  }
  if (lgaId) {
    ;[{ name: data.lgaName }] = await knex('Lga').where('id', lgaId).select('name')
  }
  return data
}

// ---------------------------------------------------------------------------
async function getDataForReportDrTb10AStool(auth, query, timezone, options) {
  const { sharedResults, useNamedData } = options

  const { getQueryForXdrCountsByReferringSiteIds } = await reportDrTb10ABaseQuery(auth, query)
  // eslint-disable-next-line prefer-const
  let { data, deviceInfo } = sharedResults[useNamedData]

  const { stateId, lgaId, siteName } = query
  const { userName, cell, phone, email } = await resolveUserFromAuth(auth)

  data = await getDataForSheet1or2(
    data,
    { userName, cell, phone, email }, // current user props
    { stateId, lgaId, siteName }, // props from query
    {
      /**
       * 2nd worksheet shows only sample type `Stool`
       */
      sampleType: ['Stool'],
      getQueryForXdrCountsByReferringSiteIds,
    }
  )
  data = { ...data, ...deviceInfo[0] }
  return {
    ok: true,
    data,
  }
}

// ---------------------------------------------------------------------------
/**
 * getDataForReportDrTb10B
 */
async function getDataForReportDrTb10B(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)

  const now = new Date()
  const { minDate = startOfMonth(now), maxDate = endOfMonth(now) } = query

  let dateFrom = _.isString(minDate) ? new Date(minDate) : minDate
  const dateTo = _.isString(maxDate) ? new Date(maxDate) : maxDate

  if (dateFrom >= dateTo) {
    dateFrom = subMonths(dateTo, 1)
  }

  const assayIds = await allAssayToId()
  const resultCategoryIds = await allResultCategoryToId()

  /**
   * old func `checkResistance`
   */
  // const checkResistance = (resistance, key) => `CASE
  //         WHEN JSON_SEARCH(r.resultData ->> '$.detectedResistance[*]', 'one', '${resistance}') IS NOT NULL
  //         THEN 'X'
  //         ELSE ' '
  //         END as ${key}
  //      `
  const checkResistance = (resistance, key) => `CASE
          WHEN JSON_SEARCH(r.resultData->>'$.detectedResistance[*]', 'one', '${resistance}') IS NOT NULL
            THEN
              CASE
              WHEN r.resultData->>'$.resultText' LIKE '%High ${resistance} Resistance @label_result_detected%'
                THEN 'High ${resistance} Resistance Detected'
              WHEN r.resultData->>'$.resultText' LIKE '%Very Low ${resistance} Resistance @label_result_detected%'
                THEN 'Very Low ${resistance} Resistance Detected'
              WHEN r.resultData->>'$.resultText' LIKE '%Low ${resistance} Resistance @label_result_detected%'
                THEN 'Low ${resistance} Resistance Detected'
              ELSE '${resistance} Resistance Detected'
              END
          WHEN r.resultData->>'$.allResistances.${resistance}' = 'Detected'
            THEN '${resistance} Resistance Detected'
          WHEN r.resultData->>'$.allResistances.${resistance}' = 'NotDetected'
            THEN '${resistance} Resistance Not Detected'
          WHEN r.resultData->>'$.allResistances.${resistance}' = 'Indeterminate'
            THEN '${resistance} Resistance Indeterminate'
          ELSE ' '
        END as ${key}
    `
  const dataQuery = knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftOuterJoin('Site as s', 's.id', 'r.siteId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'st.id', 'g.stateId')
    .leftOuterJoin('Lga as lg', 'lg.id', 'g.lgaId')
    .leftOuterJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftOuterJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftOuterJoin('Site as rs', 'r.referringSiteId', 'rs.id')
    // scope XDR and Mtb and Mtb-Ultra assays (MTB Detected RIF Detected)
    .where(function (q) {
      q.where('a.id', assayIds.GxMtbXdr).orWhere(function (qq) {
        qq.whereIn('a.id', [assayIds.GxMtbRif, assayIds.GxMtbRifUltra])
          .where('rc2.externalId', 'Detected')
          .where('rc1.externalId', 'Detected')
      })
    })
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
      geography: 'g',
      assay: 'a',
      result: 'r',
    })
    .modify(sortPageParams, query, 'r.endedOn')
    // apply date range filter
    .modify(filterDateRangeParams, { minDate: dateFrom, maxDate: dateTo }, 'r.endedOn')
    // apply remaining filters
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
    })
    .select(
      'r.endedOn as dateOfDiagnosis',
      knex.raw(
        `COALESCE(
          r.patientData->>'$.PatientName',
          r.patientData->>'$.name'
        ) as patientName`
      ),
      knex.raw(
        `COALESCE(
          r.patientData->>'$.PatientAge',
          r.patientData->>'$.age'
        ) as patientAge`
      ),
      knex.raw(`
      CASE WHEN r.patientData->>'$.TypeOfPatient' = 'Failures of Category I' THEN '1'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Failures of Retreatment' THEN '2'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Non converters of Category I' THEN '3'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Non converters of Retreatment' THEN '4'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Relapses' AND r.patientData->>'$.PatientRetreatment' = 'Category I' THEN '5a'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Relapses' AND r.patientData->>'$.PatientRetreatment' = 'Retreatment' THEN '5b'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Treatment after loss to follow up' AND r.patientData->>'$.PatientRetreatment' = 'Category I' THEN '6a'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Treatment after loss to follow up' AND r.patientData->>'$.PatientRetreatment' = 'Retreatment' THEN '6b'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Close contacts of DR TB patient with symptoms' AND r.patientData->>'$.PatientHistory' = 'Unknown history' THEN '7a'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Close contacts of DR TB patient with symptoms' AND r.patientData->>'$.PatientHistory' = 'New' THEN '7b'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Close contacts of DR TB patient with symptoms' AND r.patientData->>'$.PatientHistory' = 'Previously treated' THEN '7c'
      WHEN r.patientData->>'$.TypeOfPatient' = 'HIV infected person, with TB S/S' AND r.patientData->>'$.PatientHistory' = 'Unknown history' THEN '8a'
      WHEN r.patientData->>'$.TypeOfPatient' = 'HIV infected person, with TB S/S' AND r.patientData->>'$.PatientHistory' = 'New' THEN '8b'
      WHEN r.patientData->>'$.TypeOfPatient' = 'HIV infected person, with TB S/S' AND r.patientData->>'$.PatientHistory' = 'Previously treated' THEN '8c'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Others - Pulmonary, clinically diagnosed' AND r.patientData->>'$.PatientHistory' = 'Unknown history' THEN '9ia'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Others - Pulmonary, clinically diagnosed' AND r.patientData->>'$.PatientHistory' = 'New' THEN '9ib'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Others - Pulmonary, clinically diagnosed' AND r.patientData->>'$.PatientHistory' = 'Previously treated' THEN '9ic'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Others - Extra Pulmonary' AND r.patientData->>'$.PatientHistory' = 'Unknown history' THEN '9iia'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Others - Extra Pulmonary' AND r.patientData->>'$.PatientHistory' = 'New' THEN '9iib'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Others - Extra Pulmonary' AND r.patientData->>'$.PatientHistory' = 'Previously treated' THEN '9iic'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Others - Pulmonary, Bacteriologically Confirmed' AND r.patientData->>'$.PatientHistory' = 'Unknown history' THEN '9iiia'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Others - Pulmonary, Bacteriologically Confirmed' AND r.patientData->>'$.PatientHistory' = 'New' THEN '9iiib'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Presumptive Pulmonary Smear Negative TB Cases' AND r.patientData->>'$.PatientHistory' = 'Unknown history' THEN '10a'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Presumptive Pulmonary Smear Negative TB Cases' AND r.patientData->>'$.PatientHistory' = 'New' THEN '10b'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Presumptive Pulmonary Smear Negative TB Cases' AND r.patientData->>'$.PatientHistory' = 'Previously treated' THEN '10c'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Presumptive TB' AND r.patientData->>'$.PatientHistory' = 'Unknown history' THEN '11a'
      WHEN r.patientData->>'$.TypeOfPatient' = 'Presumptive TB' AND r.patientData->>'$.PatientHistory' = 'New' THEN '11b'
      ELSE '-'
      END as patientType`),
      // knex.raw(`
      //   CASE
      //     WHEN r.patientData->>'$.SampleType' = 'Pulmonary' THEN 'Sputum'
      //     WHEN r.patientData->>'$.SampleType' = 'Extra-pulmonary' THEN 'Others'
      //     WHEN r.patientData->>'$.SampleType' = 'Stool' THEN 'Stool'
      //     ELSE ''
      //   END as sampleType`),
      knex.raw(`
        CASE
          WHEN r.patientData->>'$.SampleType' = 'Pulmonary' THEN 'Sputum'
          WHEN r.patientData->>'$.SampleType' = 'Extra-pulmonary' THEN 'Others'
          WHEN r.patientData->>'$.SampleType' = 'Stool' THEN 'Stool'
          ELSE ''
        END as sampleType`),

      knex.raw(`r.patientData->>'$.RepeatTest' as repeatTest`),
      knex.raw(`r.patientData->>'$.TBRegistrationNumberCurrent' as tbRegistrationNumber`),
      knex.raw(`r.resultData->>'$.bacterialLoad' as bacterialLoad`),
      knex.raw(`CASE WHEN a.id = ${assayIds.GxMtbXdr} THEN rc1.name ELSE '' END as mtbDetected`),
      knex.raw(
        `
        CASE
          COALESCE(
            r.patientData->>'$.PatientGender',
            r.patientData->>'$.gender'
          )
        WHEN 'Male' THEN 'M'
        WHEN 'Female' THEN 'F'
        ELSE '-'
        END as gender
        `
      ),
      knex.raw(checkResistance('INH', 'inhDetected')),
      knex.raw(checkResistance('FLQ', 'flqDetected')),
      knex.raw(checkResistance('AMK', 'amkDetected')),
      knex.raw(checkResistance('KAN', 'kanDetected')),
      knex.raw(checkResistance('CAP', 'capDetected')),
      knex.raw(checkResistance('ETH', 'ethDetected')),
      knex.raw(
        `CONCAT(
            IFNULL(r.patientData ->> '$.address', ''),
            CASE
              WHEN
                IFNULL(
                  COALESCE(
                    r.patientData ->> '$.PatientStreet',
                    r.patientData ->> '$.street'
                  ),
                '') = ''
                OR
                r.patientData->>'$.address' LIKE CONCAT('%', COALESCE(r.patientData->>'$.PatientStreet', r.patientData->>'$.street'), '%')
              THEN ''
              ELSE CONCAT(' ', COALESCE(r.patientData->>'$.PatientStreet', r.patientData->>'$.street'))
            END,
            IFNULL(
              COALESCE(
                r.patientData->>'$.PatientPhone',
                r.patientData->>'$.phone'
              ),
              ''
            )
         ) as patientAddressAndCell`
      ),
      knex.raw(`
        CASE
        WHEN IFNULL(rs.name, '') <> ''
        THEN CONCAT(
            rs.name,
            CASE WHEN IFNULL(rs.street1, '') = '' OR rs.street1 LIKE CONCAT('%', rs.name, '%') THEN '' ELSE CONCAT('\\n', rs.street1) END,
            CASE WHEN IFNULL(rs.street2, '') = '' THEN '' ELSE CONCAT('\\n', rs.street2) END,
            CASE WHEN IFNULL(rs.city, '') = '' THEN '' ELSE CONCAT('\\n', rs.city) END,
            CASE WHEN IFNULL(rs.zip, '') = '' THEN '' ELSE CONCAT('\\n', rs.zip) END
          )
        ELSE IFNULL(r.patientData->>'$.ReferringFacility', '')
        END as referringAddressAndCell
      `),
      knex.raw(
        `CONCAT(
          IFNULL(r.patientData->>'$.TBRegistrationNumberCurrent', ''),
          ' ',
          IFNULL(r.patientData->>'$.TBRegistrationNumberPrevious', '')
        ) as tbRegistrationNumber`
      ),
      /**
       * T = MTB detected, Rif resistance not detected,
       * RR = MTB detected, Rif resistance detected,
       * TI = MTB detected, Rif resistance indeterminate,
       * N  = MTB not detected,
       * I = Invalid/ no result/ error
       */
      knex.raw(`
          CASE WHEN a.id IN (${assayIds.GxMtbRif}, ${assayIds.GxMtbRifUltra})
          THEN
            (CASE
              WHEN r.resultCategory1 = ${resultCategoryIds.Detected}
                    AND
                    r.resultCategory2 = ${resultCategoryIds.NotDetected} THEN 'T'
              WHEN r.resultCategory1 = ${resultCategoryIds.Detected}
                    AND
                    r.resultCategory2 = ${resultCategoryIds.Detected} THEN 'RR'
              WHEN r.resultCategory1 = ${resultCategoryIds.Detected}
                    AND
                    r.resultCategory2 = ${resultCategoryIds.Indeterminate} THEN 'TI'
              WHEN r.resultCategory1 = ${resultCategoryIds['Trace Detected']} THEN 'TT'
              WHEN r.resultCategory1 = ${resultCategoryIds.NotDetected} THEN 'N'
              WHEN r.resultCategory1 IN (
                      ${resultCategoryIds.Invalid},
                      ${resultCategoryIds.Error},
                      ${resultCategoryIds.NoResult}
                    ) THEN 'I'
              ELSE '-'
            END)
          ELSE ''
          END as resultMtbRif
      `),
      's.name as siteMtbRif',
      's.name as siteName',
      'lg.name as lgaName',
      'st.name as stateName'
    )

  const data = await dataQuery

  return {
    ok: true,
    total: data.length,
    data: {
      total: data.length,
      rows: data,
    },
  }
}

/**
 * getDataForReportCovid19
 */
async function getDataForReportCovid19(auth, query, groupBySite = false) {
  const dataConstraints = await getConstraints(auth.credentials)
  const now = new Date()
  const { minDate = startOfMonth(now), maxDate = endOfMonth(now) } = query

  let dateFrom = _.isString(minDate) ? new Date(minDate) : minDate
  const dateTo = _.isString(maxDate) ? new Date(maxDate) : maxDate

  if (dateFrom >= dateTo) {
    dateFrom = subMonths(dateTo, 1)
  }

  const assayIds = await allAssayToId()
  const resultCategoryIds = await allResultCategoryToId()
  const positiveResultCategories = _.values(_.pick(resultCategoryIds, getPositiveCategoriesExternalIds()))
  const negativeResultCategories = _.values(_.pick(resultCategoryIds, ['NotDetected', 'Negative']))

  const conditionBase = (typeOfTest, gender, extraCondition) => {
    let condition = `
      COALESCE(
        r.patientData->>'$.PatientGender',
        r.patientData->>'$.gender'
      ) = '${gender}'
      and
      (r.patientData->>'$.PatientHistory') = '${typeOfTest}'
    `
    if (extraCondition) {
      condition += ` and ${extraCondition} `
    }
    return condition
  }

  /**
   * define all returned counts
   */
  const fields = {
    cntAll: knex.raw('DISTINCT r.id'),

    cnt_Invalid: counter('r.id', `r.resultCategory1 = ${resultCategoryIds.Invalid}`),
    cnt_NoResult: counter('r.id', `r.resultCategory1 = ${resultCategoryIds.NoResult}`),
    cnt_Error: counter('r.id', `r.resultCategory1 = ${resultCategoryIds.Error}`),
    /**
     * column C - Type of Test : New, Male
     */
    cnt_new_male_all: counter('r.id', conditionBase('New', 'Male')),
    cnt_new_male_positive: counter(
      'r.id',
      conditionBase('New', 'Male', `r.resultCategory1 IN (${positiveResultCategories})`)
    ),
    cnt_new_male_negative: counter(
      'r.id',
      conditionBase('New', 'Male', `r.resultCategory1 IN (${negativeResultCategories})`)
    ),
    /**
     * column D - Type of Test : New, Female
     */
    cnt_new_female_all: counter('r.id', conditionBase('New', 'Female')),
    cnt_new_female_positive: counter(
      'r.id',
      conditionBase('New', 'Female', `r.resultCategory1 IN (${positiveResultCategories})`)
    ),
    cnt_new_female_negative: counter(
      'r.id',
      conditionBase('New', 'Female', `r.resultCategory1 IN (${negativeResultCategories})`)
    ),
    /**
     * column F - Type of Test : Follow up, Female
     */
    cnt_treated_male_all: counter('r.id', conditionBase('Previously treated', 'Male')),
    cnt_treated_male_positive: counter(
      'r.id',
      conditionBase('Previously treated', 'Male', `r.resultCategory1 IN (${positiveResultCategories})`)
    ),
    cnt_treated_male_negative: counter(
      'r.id',
      conditionBase('Previously treated', 'Male', `r.resultCategory1 IN (${negativeResultCategories})`)
    ),
    /**
     * column H - Type of Test : Follow up, Male
     */
    cnt_treated_female_all: counter('r.id', conditionBase('Previously treated', 'Female')),
    cnt_treated_female_positive: counter(
      'r.id',
      conditionBase('Previously treated', 'Female', `r.resultCategory1 IN (${positiveResultCategories})`)
    ),
    cnt_treated_female_negative: counter(
      'r.id',
      conditionBase('Previously treated', 'Female', `r.resultCategory1 IN (${negativeResultCategories})`)
    ),
  }

  const data = await knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftOuterJoin('Site as s', 's.id', 'r.siteId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('ResultCategoryAssay as rca1', function () {
      this.on('r.assayId', 'rca1.assayId').andOn('r.resultCategory1', 'rca1.resultCategoryId')
    })
    .leftJoin('ResultCategoryAssay as rca2', function () {
      this.on('r.assayId', 'rca2.assayId').andOn('r.resultCategory2', 'rca2.resultCategoryId')
    })
    // scope Covid19 assay
    .whereIn('a.id', [assayIds.assayGXCovid19])
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
      geography: 'g',
      assay: 'a',
      result: 'r',
    })
    .select('r.siteId')
    // apply date range filter
    .modify(filterDateRangeParams, { minDate: dateFrom, maxDate: dateTo }, 'r.endedOn')
    // apply remaining filters
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
    })
    .modify(qb => {
      if (groupBySite) qb.groupBy('r.siteId')
    })
    .count(fields)

  return {
    ok: true,
    data,
  }
}

async function getReportDrTb10a10bCovidNtpUse(auth, query) {
  const { drTb10AData } = await reportDrTb10ABaseQuery(auth, query)
  const drTb10ADataNtp = drTb10AData
    .clone()
    .leftOuterJoin('Lga as lga', 'lga.id', 'g.lgaId')
    .leftOuterJoin('State as state', 'state.id', 'g.stateId')
    .select('s.id as siteId', 's.name as siteName', 'state.name as stateName', 'lga.name as lgaName')
  const CONSTANT_COLS = [
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_Presumptive_TB_Cases_UnknownHistory_all',
      value: 'presumptiveUnknown',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_Presumptive_TB_Cases_UnknownHistory_Mtb',
      value: 'presumptiveUnknown',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_Presumptive_TB_Cases_UnknownHistory_MtbRif',
      value: 'presumptiveUnknown',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_Presumptive_TB_Cases_New_all',
      value: 'presumptiveNew',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_Presumptive_TB_Cases_New_Mtb',
      value: 'presumptiveNew',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_Presumptive_TB_Cases_New_MtbRif',
      value: 'presumptiveNew',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_Column_3_all',
      value: 'col3',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_Column_3_Mtb',
      value: 'col3',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_Column_3_MtbRif',
      value: 'col3',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_Column_4_all',
      value: 'col4',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_Column_4_Mtb',
      value: 'col4',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_Column_4_MtbRif',
      value: 'col4',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_Column_5_all',
      value: 'col5',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_Column_5_Mtb',
      value: 'col5',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_Column_5_MtbRif',
      value: 'col5',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_Column_6_all',
      value: 'col6',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_Column_6_Mtb',
      value: 'col6',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_Column_6_MtbRif',
      value: 'col6',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_Column_7_all',
      value: 'col7',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_Column_7_Mtb',
      value: 'col7',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_Column_7_MtbRif',
      value: 'col7',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_Column_8_all',
      value: 'col8',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_Column_8_Mtb',
      value: 'col8',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_Column_8_MtbRif',
      value: 'col8',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_Column_9_all',
      value: 'col9',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_Column_9_Mtb',
      value: 'col9',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_Column_9_MtbRif',
      value: 'col9',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_Column_10_all',
      value: 'col10',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_Column_10_Mtb',
      value: 'col10',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_Column_10_MtbRif',
      value: 'col10',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_Column_11_all_UnknownHistory',
      value: 'col11Unknown',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_Column_11_all_New',
      value: 'col11Unknown',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_Column_11_all_PrevTreated',
      value: 'col11Unknown',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_Column_11_Mtb_UnknownHistory',
      value: 'col11New',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_Column_11_Mtb_New',
      value: 'col11New',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_Column_11_Mtb_PrevTreated',
      value: 'col11New',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_Column_11_MtbRif_UnknownHistory',
      value: 'col11Prev',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_Column_11_MtbRif_New',
      value: 'col11Prev',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_Column_11_MtbRif_PrevTreated',
      value: 'col11Prev',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_Column_12_all_UnknownHistory',
      value: 'col12Unknown',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_Column_12_all_New',
      value: 'col12Unknown',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_Column_12_all_PrevTreated',
      value: 'col12Unknown',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_Column_12_Mtb_UnknownHistory',
      value: 'col12New',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_Column_12_Mtb_New',
      value: 'col12New',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_Column_12_Mtb_PrevTreated',
      value: 'col12New',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_Column_12_MtbRif_UnknownHistory',
      value: 'col12Prev',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_Column_12_MtbRif_New',
      value: 'col12Prev',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_Column_12_MtbRif_PrevTreated',
      value: 'col12Prev',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_OtherPulmClinDiag_UnknownHistory_all',
      value: 'pulmUnknown',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_OtherPulmClinDiag_UnknownHistory_Mtb',
      value: 'pulmUnknown',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_OtherPulmClinDiag_UnknownHistory_MtbRif',
      value: 'pulmUnknown',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_OtherPulmClinDiag_New_all',
      value: 'pulmNew',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_OtherPulmClinDiag_New_Mtb',
      value: 'pulmNew',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_OtherPulmClinDiag_New_MtbRif',
      value: 'pulmNew',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_OtherPulmClinDiag_Treated_all',
      value: 'pulmPrev',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_OtherPulmClinDiag_Treated_Mtb',
      value: 'pulmPrev',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_OtherPulmClinDiag_Treated_MtbRif',
      value: 'pulmPrev',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_OtherExtraPulm_UnknownHistory_all',
      value: 'extraPulmUnknown',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_OtherExtraPulm_UnknownHistory_Mtb',
      value: 'extraPulmUnknown',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_OtherExtraPulm_UnknownHistory_MtbRif',
      value: 'extraPulmUnknown',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_OtherExtraPulm_New_all',
      value: 'extraPulmNew',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_OtherExtraPulm_New_Mtb',
      value: 'extraPulmNew',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_OtherExtraPulm_New_MtbRif',
      value: 'extraPulmNew',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_OtherExtraPulm_Treated_all',
      value: 'extraPulmPrev',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_OtherExtraPulm_Treated_Mtb',
      value: 'extraPulmPrev',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_OtherExtraPulm_Treated_MtbRif',
      value: 'extraPulmPrev',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_OtherPulmBactConf_UnknownHistory_all',
      value: 'pulmBactUnknown',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_OtherPulmBactConf_UnknownHistory_Mtb',
      value: 'pulmBactUnknown',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_OtherPulmBactConf_UnknownHistory_MtbRif',
      value: 'pulmBactUnknown',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_OtherPulmBactConf_New_all',
      value: 'pulmBactNew',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_OtherPulmBactConf_New_Mtb',
      value: 'pulmBactNew',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_OtherPulmBactConf_New_MtbRif',
      value: 'pulmBactNew',
    },

    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_UnknownHistory_all',
      value: 'smearUnknown',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_UnknownHistory_Mtb',
      value: 'smearUnknown',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_UnknownHistory_MtbRif',
      value: 'smearUnknown',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_New_all',
      value: 'smearNew',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_New_Mtb',
      value: 'smearNew',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_New_MtbRif',
      value: 'smearNew',
    },
    {
      line: 'line1',
      key: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_PrevTreated_all',
      value: 'smearPrev',
    },
    {
      line: 'line2',
      key: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_PrevTreated_Mtb',
      value: 'smearPrev',
    },
    {
      line: 'line3',
      key: 'cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_PrevTreated_MtbRif',
      value: 'smearPrev',
    },
    {
      line: 'line1', // merged cell, only line 1 has to be filled
      key: 'cnt_Presumptive_TB_Cases_MtbDetectedRifIndeterminate',
      value: 'presumtiveTbIndeterminated',
    },
    {
      line: 'line1', // merged cell, only line 1 has to be filled
      key: 'cnt_Presumptive_DR_TB_Cases_MtbDetectedRifIndeterminate',
      value: 'presumtiveDrTbIndeterminated',
    },
    {
      line: 'line1',
      key: 'cnt_Presumptive_TB_Cases_NoResult',
      value: 'presumptiveTbInvalid',
    },
    {
      line: 'line1',
      key: 'cnt_Presumptive_TB_Cases_NoResult',
      value: 'presumptiveTbNoResult',
    },
    {
      line: 'line1',
      key: 'cnt_Presumptive_TB_Cases_Error',
      value: 'presumptiveTbError',
    },
    {
      line: 'line1',
      key: 'cnt_Presumptive_DR_TB_Cases_Invalid',
      value: 'presumptiveDrTbInvalid',
    },
    {
      line: 'line1',
      key: 'cnt_Presumptive_DR_TB_Cases_NoResult',
      value: 'presumptiveDrTbNoResult',
    },
    {
      line: 'line1',
      key: 'cnt_Presumptive_DR_TB_Cases_Error',
      value: 'presumptiveDrTbError',
    },
  ]
  const data = await drTb10ADataNtp
  const obj = {}
  const newDataset = _.reduce(
    data,
    (oldVal, current) => {
      _.forEach(_.keys(current), key => {
        const found = _.find(CONSTANT_COLS, { key })
        if (found) {
          const { deviceId, lgaName, siteId, siteName, stateName } = current

          obj[found.line] = {
            ...obj[found.line],
            [found.value]: current[key],
            deviceId,
            lgaName,
            siteId,
            siteName,
            stateName,
          }
        }
      })
      oldVal.push({ ...obj.line1, deviceName: 'Tested by Xpert MTB/RIF' })
      oldVal.push({ ...obj.line2, deviceName: 'MTB detected' })
      oldVal.push({ ...obj.line3, deviceName: 'RR TB detected' })
      return oldVal
    },
    []
  )
  return {
    ok: true,
    data: newDataset,
  }
}

const getReportCustomFieldsCompletion = async (auth, query) => {
  const dataConstraints = await getConstraints(auth.credentials)
  const { partnerId } = await resolveUserFromAuth(auth)
  const dates = getDatesFromQuery(query)
  let { dateFrom } = dates
  const { dateTo } = dates
  if (dateFrom >= dateTo) {
    dateFrom = subMonths(dateTo, 1)
  }
  const assayIds = await allAssayToId()

  const queryForm = await knex('FormType AS ft')
    .join('FormDefinition as fd', 'fd.formTypeId', 'ft.id')
    .innerJoin('Disease as d', 'fd.diseaseId', 'd.id')
    .where('fd.partnerId', partnerId)
    .where('ft.externalId', 'gxConnectForm')
    .where('d.externalId', 'tb') // <-- includes MTB and MTB-Ultra
    .distinct(
      'fd.externalId',
      'fd.assayId',
      'fd.diseaseId',
      'ft.externalId as formTypeId',
      knex.raw("REPLACE(fd.jsonSchemaFile, '.json', '') as jsonSchemaFileName")
    )
  /**
   * `forms` is a object with 2 props for 2 forms
   * {
   *    CustomFields_Bangladesh_Mtb: {...},
   *    CustomFields_Bangladesh_Mtb_Ultra: {...},
   * }
   */
  const forms = createFormObject(queryForm)

  /**
   * `allFormFields` is a object with 2 props for 2 forms
   * {
   *    CustomFields_Bangladesh_Mtb: {
   *      cnt_FIELD_NAME_1: knex.raw('...'),
   *      cnt_FIELD_NAME_2: knex.raw('...'),
   *      ...
   *    },
   *    CustomFields_Bangladesh_Mtb_Ultra: {...},
   * }
   */
  let allColumns = []
  const allFormFields = _.reduce(
    _.keys(forms),
    (accForm, formKey) => {
      const { fields } = forms[formKey]
      let { assayId } = forms[formKey]
      const header = `Total Results (${assayId ? 'Mtb-Ultra' : 'Mtb'})`
      assayId = assayId || assayIds.GxMtbRif
      allColumns = [
        ...allColumns,
        {
          key: `cntAll_${assayId}`,
          header,
        },
      ]

      accForm[formKey] = _.reduce(
        fields,
        (acc, field) => {
          const { name, title, gxAlertDbColumn } = field
          const fieldName = gxAlertDbColumn || name
          acc[`cnt_${assayId}_${fieldName}`] = knex.raw(
            `
            DISTINCT
            CASE
              WHEN
                a.id = ${assayId}
                AND
                IFNULL(r.patientData->>'$.${fieldName}', '') IN ('', 'null')
              THEN r.id
              ELSE null
            END`
          )

          allColumns = [
            ...allColumns,
            {
              key: `cnt_${assayId}_${fieldName}`,
              header: title,
            },
          ]

          return acc
        },
        // initial object with counter for all affected results
        {
          [`cntAll_${assayId}`]: knex.raw(`DISTINCT
            CASE
              WHEN a.id = ${assayId}
              THEN r.id
              ELSE null
            END`),
        }
      )

      /**
       * in case of poor performance when using `DISTINCT ... r.id` -
       * try
       * knex.raw(`
       *  SUM(
       *    CASE
       *    WHEN IFNULL(r.patientData->>'$.${fieldName}', '') IN ('', 'null')
       *    THEN 1
       *    ELSE 0
       *    END
       *  ) as cnt_${assayId}_${fieldName}
       * `)
       */

      return accForm
    },
    {}
  )

  const allCustomFields = _.reduce(
    _.values(allFormFields),
    (acc, formFields) => {
      acc = {
        ...acc,
        ...formFields,
      }
      return acc
    },
    {}
  )

  const data = await knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftOuterJoin('Site as s', 's.id', 'r.siteId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .whereIn('a.id', [assayIds.GxMtbRif, assayIds.GxMtbRifUltra])
    .modify(addConstraints, dataConstraints, {
      device: 'd',
      site: 's',
      geography: 'g',
      assay: 'a',
      result: 'r',
    })
    .modify(filterDateRangeParams, { minDate: dateFrom, maxDate: dateTo }, 'r.endedOn')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
    })
    .select('s.id as siteId', 's.name as siteName')
    .groupBy('s.id')
    .count({
      cntAll: knex.raw('DISTINCT r.id'),
      ...allCustomFields,
    })
    .orderBy('s.name')

  data.forEach(siteRow => {
    let sum = 0
    let totalFields = 0
    _.keys(forms).forEach(formKey => {
      const { fields } = forms[formKey]
      let { assayId } = forms[formKey]
      assayId = assayId || assayIds.GxMtbRif

      const total = siteRow[`cntAll_${assayId}`]
      fields.forEach(field => {
        const fieldName = field.gxAlertDbColumn || field.name
        const percentRaw = total > 0 ? (100 * siteRow[`cnt_${assayId}_${fieldName}`]) / total : 0
        const percent = percentRaw === 0 ? 0 : percentRaw < 1 ? _.round(percentRaw, 2) : _.round(percentRaw)
        siteRow[`cnt_${assayId}_${fieldName}`] = `${percent}%`
        sum += percent
      })
      totalFields += fields.length
    })
    siteRow.overall = `${_.round(sum / totalFields, 2)}%`
  })
  allColumns = [
    ...allColumns,
    {
      key: `overall`,
      header: 'Overall Completion Rate',
    },
  ]

  return {
    ok: true,
    data,
    dynamicColumns: allColumns,
  }
}

// ---------------------------------------------------------------------------
async function getDataForReportForNtpUse(auth, query, timezone, options) {
  const { sharedResults, useNamedData } = options
  /**
   * get data from some of previous worksheet saved in cache.
   *
   * --> See func `getSheetData` in `api/src/report/serviceReports.js`
   * and for line `sharedResults[nameOfSharedData] = result`
   * --> Also see file `api/seeds/bangladesh/fixtures/reports.js`
   * for this worksheet and see there `useNamedData: 'results_10a_for_nt_use'`
   */
  const { data } = sharedResults[useNamedData]
  /**
   * show only Detected Mtb/Rif and Mtb/Rif-Ultra (RR) data or `Resistance Detected` Xdr data
   */
  const dataRR = _.cloneDeep(data)

  dataRR.total = dataRR.rows.length

  return {
    ok: true,
    data: dataRR,
  }
}

async function resolveUserFromAuth(auth) {
  // In report-based notifications we don't pass a real auth object,
  // so personal user information may not be available.
  if (!auth.credentials.name) {
    return {}
  }

  return getUser(auth.credentials.name)
}

module.exports = {
  getDataForReportDrTb10A,
  getDataForReportDrTb10AStool,
  getDataForReportDrTb10B,
  getDataForReportCovid19,
  getReportDrTb10a10bCovidNtpUse,
  getReportCustomFieldsCompletion,
  getDataForReportForNtpUse,
  reportDrTb10ABaseQuery,
}
