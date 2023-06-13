const _ = require('lodash')
const dateFormat = require('date-fns/format')
const { endOfMonth, startOfMonth, subMonths } = require('date-fns')

const { getUser } = require('../../auth/service')
const { addConstraints, getConstraints } = require('../../auth/constraints')
const { knex, filterParams, filterDateRangeParams, sortPageParams } = require('../../db')
const { formatDateOrDefault, getDatesFromQuery } = require('../../shared/date')
const { allAssayToId, allResultCategoryToId } = require('../../shared/dictionary')
const getPositiveCategoriesExternalIds = require('../../resultCategory/service')
const logger = require('../../shared/logger')
const { RELABEL_EXCEL } = require('../../shared/constants')
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
  IFNULL(r.patientData ->> '$.TypeOfPatient', '') = '${value}'
`
// ----------------
const patientHistory = value => `
  IFNULL(r.patientData ->> '$.PatientHistory', '') = '${value}'
`
// ----------------
const patientRetreatment = value => `
  IFNULL(r.patientData ->> '$.PatientRetreatment', '') = '${value}'
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
    IFNULL(r.patientData ->> '$.TypeOfPatient', '') IN (${typeOfPatient})
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
const andByHistory = (typeOfPatientValue, patientHistoryValue, resultCategoryCondition) => {
  let condition = `
    ${typeOfPatient(typeOfPatientValue)}
  `
  if (patientHistoryValue) {
    condition += ` and ${patientHistory(patientHistoryValue)} `
  }
  if (resultCategoryCondition) {
    condition += ` and ${resultCategoryCondition} `
  }
  return counter('r.id', condition)
}
// ----------------
const andByRetreatment = (typeOfPatientValue, patientRetreatmentValue, resultCategoryCondition) => {
  let condition = `
    ${typeOfPatient(typeOfPatientValue)}
  `
  if (patientRetreatmentValue) {
    condition += ` and ${patientRetreatment(patientRetreatmentValue)} `
  }
  if (resultCategoryCondition) {
    condition += ` and ${resultCategoryCondition} `
  }
  return counter('r.id', condition)
}

const reportDrTb10ABaseQuery = async (auth, query) => {
  const dataConstraints = await getConstraints(auth.credentials)

  const dates = getDatesFromQuery(query)
  let { dateFrom } = dates
  const { dateTo } = dates
  if (dateFrom >= dateTo) {
    dateFrom = subMonths(dateTo, 1)
  }
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
  return {
    drTb10AData: knex('Result as r')
      .innerJoin('Device as d', 'r.deviceId', 'd.id')
      .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
      .innerJoin('Assay as a', 'r.assayId', 'a.id')
      .leftOuterJoin('Site as s', 's.id', 'r.siteId')
      .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
      /**
       * join to `DeviceCapacity` to count number of modules per device
       */
      .leftOuterJoin('DeviceCapacity as dc', 'd.deviceCapacityId', 'dc.id')
      .leftJoin('ResultCategoryAssay as rca1', function () {
        this.on('r.assayId', 'rca1.assayId').andOn('r.resultCategory1', 'rca1.resultCategoryId')
      })
      .leftJoin('ResultCategoryAssay as rca2', function () {
        this.on('r.assayId', 'rca2.assayId').andOn('r.resultCategory2', 'rca2.resultCategoryId')
      })
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
      .select(
        'r.deviceId',
        knex.raw(`
          DATE_FORMAT(r.endedOn, "%Y-%m-01") as yearAndMonth
        `),
        /**
         * Notice that we below group by `deviceId`
         * only because we need to count number of modules
         * for each device
         */
        knex.raw(`
          ROUND(IFNULL(dc.dailyCapacity, 12) / 2, 0) as cntModules
        `)
      )
      .groupBy('yearAndMonth', 'r.deviceId')
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
        cnt_Presumptive_TB_Cases_Invalid: inTypeOfPatient(
          presumptiveTbCases,
          `r.resultCategory1 = ${resultCategoryIds.Invalid}`
        ),
        cnt_Presumptive_TB_Cases_NoResult: inTypeOfPatient(
          presumptiveTbCases,
          `r.resultCategory1 = ${resultCategoryIds.NoResult}`
        ),
        cnt_Presumptive_TB_Cases_Error: inTypeOfPatient(
          presumptiveTbCases,
          `r.resultCategory1 = ${resultCategoryIds.Error}`
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
        r.resultCategory1 IN (${positiveResultCategories})
        and
        r.resultCategory2 = ${resultCategoryIds.Indeterminate}
      `
        ),
        cnt_Presumptive_DR_TB_Cases_MtbDetectedRifIndeterminate: inTypeOfPatient(
          presumptiveDrTbCases,
          `
        r.resultCategory1 IN (${positiveResultCategories})
        and
        r.resultCategory2 = ${resultCategoryIds.Indeterminate}
      `
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
        // cell B26
        cnt_TypeOfPatient_Presumptive_TB_Cases_UnknownHistory_all: andByHistory('Presumptive TB', 'Unknown history'),
        // cell B29
        cnt_TypeOfPatient_Presumptive_TB_Cases_UnknownHistory_Mtb: andByHistory(
          'Presumptive TB',
          'Unknown history',
          mtbDetected
        ),
        // cell B32
        cnt_TypeOfPatient_Presumptive_TB_Cases_UnknownHistory_MtbRif: andByHistory(
          'Presumptive TB',
          'Unknown history',
          mtbRifDetected
        ),
        /** -----------------
         * Patient History = New
         */
        // cell C26
        cnt_TypeOfPatient_Presumptive_TB_Cases_New_all: andByHistory('Presumptive TB', 'New'),
        // cell C29
        cnt_TypeOfPatient_Presumptive_TB_Cases_New_Mtb: andByHistory('Presumptive TB', 'New', mtbDetected),
        // cell C32
        cnt_TypeOfPatient_Presumptive_TB_Cases_New_MtbRif: andByHistory('Presumptive TB', 'New', mtbRifDetected),
        /**
         * ****************************************
         * Block 2 - Type of Patient : Presumptive DR TB Cases
         * ****************************************
         */
        /** -----------------
         * Column (3) - remain positive at month 5 or later and smear negative patients who become smear positive at month 2
         */
        // cell E26
        cnt_TypeOfPatient_Column_3_all: andByRetreatment('Failures of Category I'),
        // cell E29
        cnt_TypeOfPatient_Column_3_Mtb: andByRetreatment('Failures of Category I', null, mtbDetected),
        // cell E32
        cnt_TypeOfPatient_Column_3_MtbRif: andByRetreatment('Failures of Category I', null, mtbRifDetected),
        /** -----------------
         * Column (4) - remain positive at month 5 or later
         */
        // cell F26
        cnt_TypeOfPatient_Column_4_all: andByRetreatment('Failures of Retreatment'),
        // cell F29
        cnt_TypeOfPatient_Column_4_Mtb: andByRetreatment('Failures of Retreatment', null, mtbDetected),
        // cell F32
        cnt_TypeOfPatient_Column_4_MtbRif: andByRetreatment('Failures of Retreatment', null, mtbRifDetected),
        /** -----------------
         * Column (5) - remain positive at month 2
         */
        // cell G26
        cnt_TypeOfPatient_Column_5_all: andByRetreatment('Non converters of Category I'),
        // cell G29
        cnt_TypeOfPatient_Column_5_Mtb: andByRetreatment('Non converters of Category I', null, mtbDetected),
        // cell G32
        cnt_TypeOfPatient_Column_5_MtbRif: andByRetreatment('Non converters of Category I', null, mtbRifDetected),
        /** -----------------
         * Column (6) - remain positive at month 3
         */
        // cell H26
        cnt_TypeOfPatient_Column_6_all: andByRetreatment('Non converters of Retreatment'),
        // cell H29
        cnt_TypeOfPatient_Column_6_Mtb: andByRetreatment('Non converters of Retreatment', null, mtbDetected),
        // cell H32
        cnt_TypeOfPatient_Column_6_MtbRif: andByRetreatment('Non converters of Retreatment', null, mtbRifDetected),
        /** -----------------
         * Column (7) - Relapses (CAT I)
         */
        // cell I26
        cnt_TypeOfPatient_Column_7_all: andByRetreatment('Relapses', 'Category I'),
        // cell I29
        cnt_TypeOfPatient_Column_7_Mtb: andByRetreatment('Relapses', 'Category I', mtbDetected),
        // cell I32
        cnt_TypeOfPatient_Column_7_MtbRif: andByRetreatment('Relapses', 'Category I', mtbRifDetected),
        /** -----------------
         * Column (8) - Relapses (CAT II)
         */
        // cell J26
        cnt_TypeOfPatient_Column_8_all: andByRetreatment('Relapses', 'Retreatment'),
        // cell J29
        cnt_TypeOfPatient_Column_8_Mtb: andByRetreatment('Relapses', 'Retreatment', mtbDetected),
        // cell J32
        cnt_TypeOfPatient_Column_8_MtbRif: andByRetreatment('Relapses', 'Retreatment', mtbRifDetected),
        /** -----------------
         * Column (9) - Treatment after loss to follow up (CAT I)
         */
        // cell K26
        cnt_TypeOfPatient_Column_9_all: andByRetreatment('Treatment after loss to follow up', 'Category I'),
        // cell K29
        cnt_TypeOfPatient_Column_9_Mtb: andByRetreatment(
          'Treatment after loss to follow up',
          'Category I',
          mtbDetected
        ),
        // cell K32
        cnt_TypeOfPatient_Column_9_MtbRif: andByRetreatment(
          'Treatment after loss to follow up',
          'Category I',
          mtbRifDetected
        ),
        /** -----------------
         * Column (10) - Treatment after loss to follow up (CAT II)
         */
        // cell L26
        cnt_TypeOfPatient_Column_10_all: andByRetreatment('Treatment after loss to follow up', 'Retreatment'),
        // cell L29
        cnt_TypeOfPatient_Column_10_Mtb: andByRetreatment(
          'Treatment after loss to follow up',
          'Retreatment',
          mtbDetected
        ),
        // cell L32
        cnt_TypeOfPatient_Column_10_MtbRif: andByRetreatment(
          'Treatment after loss to follow up',
          'Retreatment',
          mtbRifDetected
        ),
        /** -----------------
         * Column (11) - Close contacts of DR TB patient with symptoms
         */
        // cell O26
        cnt_TypeOfPatient_Column_11_all_UnknownHistory: andByHistory(
          'Close contacts of DR TB patient with symptoms',
          'Unknown history'
        ),
        // cell O27
        cnt_TypeOfPatient_Column_11_all_New: andByHistory('Close contacts of DR TB patient with symptoms', 'New'),
        // cell O28
        cnt_TypeOfPatient_Column_11_all_PrevTreated: andByHistory(
          'Close contacts of DR TB patient with symptoms',
          'Previously treated'
        ),

        // cell O29
        cnt_TypeOfPatient_Column_11_Mtb_UnknownHistory: andByHistory(
          'Close contacts of DR TB patient with symptoms',
          'Unknown history',
          mtbDetected
        ),
        // cell O30
        cnt_TypeOfPatient_Column_11_Mtb_New: andByHistory(
          'Close contacts of DR TB patient with symptoms',
          'New',
          mtbDetected
        ),
        // cell O31
        cnt_TypeOfPatient_Column_11_Mtb_PrevTreated: andByHistory(
          'Close contacts of DR TB patient with symptoms',
          'Previously treated',
          mtbDetected
        ),

        // cell O32
        cnt_TypeOfPatient_Column_11_MtbRif_UnknownHistory: andByHistory(
          'Close contacts of DR TB patient with symptoms',
          'Unknown history',
          mtbRifDetected
        ),
        // cell O33
        cnt_TypeOfPatient_Column_11_MtbRif_New: andByHistory(
          'Close contacts of DR TB patient with symptoms',
          'New',
          mtbRifDetected
        ),
        // cell O34
        cnt_TypeOfPatient_Column_11_MtbRif_PrevTreated: andByHistory(
          'Close contacts of DR TB patient with symptoms',
          'Previously treated',
          mtbRifDetected
        ),
        /** -----------------
         * Column (12) - HIV infected person with TB S/S
         */
        // cell R26
        cnt_TypeOfPatient_Column_12_all_UnknownHistory: andByHistory(
          'HIV infected person, with TB S/S',
          'Unknown history'
        ),
        // cell R27
        cnt_TypeOfPatient_Column_12_all_New: andByHistory('HIV infected person, with TB S/S', 'New'),
        // cell R28
        cnt_TypeOfPatient_Column_12_all_PrevTreated: andByHistory(
          'HIV infected person, with TB S/S',
          'Previously treated'
        ),

        // cell R29
        cnt_TypeOfPatient_Column_12_Mtb_UnknownHistory: andByHistory(
          'HIV infected person, with TB S/S',
          'Unknown history',
          mtbDetected
        ),
        // cell R30
        cnt_TypeOfPatient_Column_12_Mtb_New: andByHistory('HIV infected person, with TB S/S', 'New', mtbDetected),
        // cell R31
        cnt_TypeOfPatient_Column_12_Mtb_PrevTreated: andByHistory(
          'HIV infected person, with TB S/S',
          'Previously treated',
          mtbDetected
        ),

        // cell R32
        cnt_TypeOfPatient_Column_12_MtbRif_UnknownHistory: andByHistory(
          'HIV infected person, with TB S/S',
          'Unknown history',
          mtbRifDetected
        ),
        // cell R33
        cnt_TypeOfPatient_Column_12_MtbRif_New: andByHistory('HIV infected person, with TB S/S', 'New', mtbRifDetected),
        // cell R34
        cnt_TypeOfPatient_Column_12_MtbRif_PrevTreated: andByHistory(
          'HIV infected person, with TB S/S',
          'Previously treated',
          mtbRifDetected
        ),

        /**
         * ****************************************
         * Block 3 - Number of Presumptive smear negative TB cases
         * ****************************************
         */
        // ------------
        // cell B39
        cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_UnknownHistory_all: andByHistory(
          'Presumptive Pulmonary Smear Negative TB Cases',
          'Unknown history'
        ),
        // cell B41
        cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_UnknownHistory_Mtb: andByHistory(
          'Presumptive Pulmonary Smear Negative TB Cases',
          'Unknown history',
          mtbDetected
        ),
        // cell B43
        cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_UnknownHistory_MtbRif: andByHistory(
          'Presumptive Pulmonary Smear Negative TB Cases',
          'Unknown history',
          mtbRifDetected
        ),
        // ------------
        // cell C39
        cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_New_all: andByHistory(
          'Presumptive Pulmonary Smear Negative TB Cases',
          'New'
        ),
        // cell C41
        cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_New_Mtb: andByHistory(
          'Presumptive Pulmonary Smear Negative TB Cases',
          'New',
          mtbDetected
        ),
        // cell C43
        cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_New_MtbRif: andByHistory(
          'Presumptive Pulmonary Smear Negative TB Cases',
          'New',
          mtbRifDetected
        ),
        // ------------
        // cell D39
        cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_PrevTreated_all: andByHistory(
          'Presumptive Pulmonary Smear Negative TB Cases',
          'Previously treated'
        ),
        // cell D41
        cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_PrevTreated_Mtb: andByHistory(
          'Presumptive Pulmonary Smear Negative TB Cases',
          'Previously treated',
          mtbDetected
        ),
        // cell D43
        cnt_TypeOfPatient_Pres_SmearNeg_TB_Cases_PrevTreated_MtbRif: andByHistory(
          'Presumptive Pulmonary Smear Negative TB Cases',
          'Previously treated',
          mtbRifDetected
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
        // cell M40
        cnt_TypeOfPatient_OtherPulmClinDiag_UnknownHistory_all: andByHistory(
          'Others - Pulmonary, clinically diagnosed',
          'Unknown history'
        ),
        // cell P40
        cnt_TypeOfPatient_OtherPulmClinDiag_UnknownHistory_Mtb: andByHistory(
          'Others - Pulmonary, clinically diagnosed',
          'Unknown history',
          mtbDetected
        ),
        // cell S40
        cnt_TypeOfPatient_OtherPulmClinDiag_UnknownHistory_MtbRif: andByHistory(
          'Others - Pulmonary, clinically diagnosed',
          'Unknown history',
          mtbRifDetected
        ),
        // ------------
        // cell M41
        cnt_TypeOfPatient_OtherExtraPulm_UnknownHistory_all: andByHistory(
          'Others - Extra Pulmonary',
          'Unknown history'
        ),
        // cell P41
        cnt_TypeOfPatient_OtherExtraPulm_UnknownHistory_Mtb: andByHistory(
          'Others - Extra Pulmonary',
          'Unknown history',
          mtbDetected
        ),
        // cell S41
        cnt_TypeOfPatient_OtherExtraPulm_UnknownHistory_MtbRif: andByHistory(
          'Others - Extra Pulmonary',
          'Unknown history',
          mtbRifDetected
        ),
        // ------------
        // cell M42
        cnt_TypeOfPatient_OtherPulmBactConf_UnknownHistory_all: andByHistory(
          'Others - Pulmonary, Bacteriologically Confirmed',
          'Unknown history'
        ),
        // cell P42
        cnt_TypeOfPatient_OtherPulmBactConf_UnknownHistory_Mtb: andByHistory(
          'Others - Pulmonary, Bacteriologically Confirmed',
          'Unknown history',
          mtbDetected
        ),
        // cell S42
        cnt_TypeOfPatient_OtherPulmBactConf_UnknownHistory_MtbRif: andByHistory(
          'Others - Pulmonary, Bacteriologically Confirmed',
          'Unknown history',
          mtbRifDetected
        ),

        /**
         * Patient History = New
         */
        // ------------
        // cell N40
        cnt_TypeOfPatient_OtherPulmClinDiag_New_all: andByHistory('Others - Pulmonary, clinically diagnosed', 'New'),
        // cell Q40
        cnt_TypeOfPatient_OtherPulmClinDiag_New_Mtb: andByHistory(
          'Others - Pulmonary, clinically diagnosed',
          'New',
          mtbDetected
        ),
        // cell T40
        cnt_TypeOfPatient_OtherPulmClinDiag_New_MtbRif: andByHistory(
          'Others - Pulmonary, clinically diagnosed',
          'New',
          mtbRifDetected
        ),
        // ------------
        // cell N41
        cnt_TypeOfPatient_OtherExtraPulm_New_all: andByHistory('Others - Extra Pulmonary', 'New'),
        // cell Q41
        cnt_TypeOfPatient_OtherExtraPulm_New_Mtb: andByHistory('Others - Extra Pulmonary', 'New', mtbDetected),
        // cell T41
        cnt_TypeOfPatient_OtherExtraPulm_New_MtbRif: andByHistory('Others - Extra Pulmonary', 'New', mtbRifDetected),
        // ------------
        // cell N42
        cnt_TypeOfPatient_OtherPulmBactConf_New_all: andByHistory(
          'Others - Pulmonary, Bacteriologically Confirmed',
          'New'
        ),
        // cell Q42
        cnt_TypeOfPatient_OtherPulmBactConf_New_Mtb: andByHistory(
          'Others - Pulmonary, Bacteriologically Confirmed',
          'New',
          mtbDetected
        ),
        // cell T42
        cnt_TypeOfPatient_OtherPulmBactConf_New_MtbRif: andByHistory(
          'Others - Pulmonary, Bacteriologically Confirmed',
          'New',
          mtbRifDetected
        ),
        /**
         * Patient History = Previously treated
         */
        // ------------
        // cell O40
        cnt_TypeOfPatient_OtherPulmClinDiag_Treated_all: andByHistory(
          'Others - Pulmonary, clinically diagnosed',
          'Previously treated'
        ),
        // cell R40
        cnt_TypeOfPatient_OtherPulmClinDiag_Treated_Mtb: andByHistory(
          'Others - Pulmonary, clinically diagnosed',
          'Previously treated',
          mtbDetected
        ),
        // cell U40
        cnt_TypeOfPatient_OtherPulmClinDiag_Treated_MtbRif: andByHistory(
          'Others - Pulmonary, clinically diagnosed',
          'Previously treated',
          mtbRifDetected
        ),
        // ------------
        // cell O41
        cnt_TypeOfPatient_OtherExtraPulm_Treated_all: andByHistory('Others - Extra Pulmonary', 'Previously treated'),
        // cell R41
        cnt_TypeOfPatient_OtherExtraPulm_Treated_Mtb: andByHistory(
          'Others - Extra Pulmonary',
          'Previously treated',
          mtbDetected
        ),
        // cell U41
        cnt_TypeOfPatient_OtherExtraPulm_Treated_MtbRif: andByHistory(
          'Others - Extra Pulmonary',
          'Previously treated',
          mtbRifDetected
        ),

        /**
         * TODO: change below value and count modules that haven’t sent results
         * for several days in the given time frame (>5)
         */
        cntModulesActive: knex.raw(`DISTINCT
          CONCAT(r.deviceId, '-',  r.moduleName)
        `),
      }),
  }
}
/**
 * getDataForReportDrTb10A
 */
async function getDataForReportDrTb10A(auth, query) {
  const { stateId, lgaId, siteName } = query
  const dates = getDatesFromQuery(query)
  let { dateFrom } = dates
  const { dateTo } = dates
  if (dateFrom >= dateTo) {
    dateFrom = subMonths(dateTo, 1)
  }

  const { drTb10AData } = await reportDrTb10ABaseQuery(auth, query)
  let data = await drTb10AData
  data = _.reduce(
    data, // <-- this `data` is grouped by 'yearAndMonth' and 'deviceId'
    (acc, { deviceId, yearAndMonth, ...rest }) => {
      /**
       * Notice that above prop `rest` contains counter props
       * only, i.e. name starts with `cnt`
       */
      let item = acc[yearAndMonth]
      const propNames = _.keys(rest) // i.e. all counters `cnt*`
      if (!item) {
        item = {
          devices: {}, // this is a temporal prop to collect distinct deviceId's
        }
        propNames.forEach(propName => {
          item[propName] = 0
        })
      }
      /**
       * increment all counters
       */
      propNames.forEach(propName => {
        item[propName] += rest[propName]
      })
      /**
       * keep `deviceId`, we need only object keys
       */
      item.devices[deviceId] = null

      acc[yearAndMonth] = item
      return acc
    },
    {}
  )

  const yymm = formatDateOrDefault(dateFrom, 'yyyy-MM-01') // same format as field `yearAndMonth` in query
  /**
   * set `data` to single object with all counters prepared
   */
  data = data[yymm] || {}
  /**
   * set `cntDevices` and remove temporal prop `devices`
   */
  if (!_.isEmpty(data)) {
    data.cntDevices = _.keys(data.devices).length
  }
  delete data.devices
  /**
   * additional props
   */
  data.month = dateFormat(dateFrom, 'MMMM')
  data.quarter = dateFormat(dateFrom, 'qo')
  data.year = +dateFormat(dateFrom, 'yyyy')
  data.today = formatDateOrDefault(new Date(), 'yyyy-MM-dd')

  data.stateName = 'All'
  data.lgaName = 'All'
  data.siteName = siteName || 'All'
  if (stateId) {
    ;[{ name: data.stateName }] = await knex('State').where('id', stateId).select('name')
  }
  if (lgaId) {
    ;[{ name: data.lgaName }] = await knex('Lga').where('id', lgaId).select('name')
  }

  return {
    ok: true,
    data,
  }
}

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
  const positiveResultCategories = _.values(_.pick(resultCategoryIds, getPositiveCategoriesExternalIds()))

  const data = await knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftOuterJoin('Site as s', 's.id', 'r.siteId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftOuterJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    // scope Mtb and Mtb-Ultra assays
    .whereIn('a.id', [assayIds.GxMtbRif, assayIds.GxMtbRifUltra])
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
    .whereIn('r.resultCategory1', positiveResultCategories) // MTB Detected
    .whereIn('r.resultCategory2', positiveResultCategories) // RIF Detected
    .select(
      knex.raw(
        `COALESCE(
          r.patientData ->> '$.PatientName',
          r.patientData ->> '$.name'
        ) as patientName`
      ),
      knex.raw(
        `COALESCE(
          r.patientData ->> '$.PatientAge',
          r.patientData ->> '$.age'
        ) as patientAge`
      ),
      knex.raw(
        `
        CASE
          COALESCE(
            r.patientData ->> '$.PatientGender',
            r.patientData ->> '$.gender'
          )
        WHEN 'Male' THEN 'M'
        WHEN 'Female' THEN 'F'
        ELSE '-'
        END as gender
        `
      ),
      knex.raw(
        `CONCAT(
          IFNULL(r.patientData ->> '$.address', ''),
          ' ',
          IFNULL(
            COALESCE(
              r.patientData ->> '$.PatientStreet',
              r.patientData ->> '$.street'
            ),
            ''
          ),
          ' ',
          IFNULL(
            COALESCE(
              r.patientData ->> '$.PatientPhone',
              r.patientData ->> '$.phone'
            ),
            ''
          )
        ) as patientAddressAndCell`
      ),
      knex.raw(
        `CONCAT(
          IFNULL(r.patientData ->> '$.TBRegistrationNumberCurrent', ''),
          ' ',
          IFNULL(r.patientData ->> '$.TBRegistrationNumberPrevious', '')
        ) as tbRegistrationNumber`
      ),
      /**
       * T = MTB detected, Rif resistance not detected,
       * RR = MTB detected, Rif resistance detected,
       * TI = MTB detected, Rif resistance indeterminate,
       * N  = MTB not detected,
       * I = invalid/ no result/ error
       */
      knex.raw(`
          CASE
          WHEN r.resultCategory1 IN (${positiveResultCategories})
                AND
                r.resultCategory2 = ${resultCategoryIds.NotDetected} THEN 'T'
          WHEN r.resultCategory1 IN (${positiveResultCategories})
                AND
                r.resultCategory2 IN (${positiveResultCategories}) THEN 'RR'
          WHEN r.resultCategory1 IN (${positiveResultCategories})
                AND
                r.resultCategory2 = ${resultCategoryIds.Indeterminate} THEN 'TI'
          WHEN r.resultCategory1 = ${resultCategoryIds.NotDetected} THEN 'N'
          WHEN r.resultCategory1 IN (
                  ${resultCategoryIds.Invalid},
                  ${resultCategoryIds.Error},
                  ${resultCategoryIds.NoResult}
                ) THEN 'I'
          ELSE '-'
          END as resultMtbRif
      `)
    )

  logger.debug(`Total records: ${data.length}`, RELABEL_EXCEL)

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
async function getDataForReportCovid19(auth, query) {
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
        r.patientData ->> '$.PatientGender',
        r.patientData ->> '$.gender'
      ) = '${gender}'
      and
      (r.patientData ->> '$.PatientHistory') = '${typeOfTest}'
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
    // apply date range filter
    .modify(filterDateRangeParams, { minDate: dateFrom, maxDate: dateTo }, 'r.endedOn')
    // apply remaining filters
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
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
          const { deviceId, lgaName, siteId, siteName, stateName, yearAndMonth } = current

          obj[found.line] = {
            ...obj[found.line],
            [found.value]: current[key],
            deviceId,
            lgaName,
            siteId,
            siteName,
            stateName,
            yearAndMonth,
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
  const { partnerId } = await getUser(auth.credentials.name)
  const dates = getDatesFromQuery(query)
  let { dateFrom } = dates
  const { dateTo } = dates
  if (dateFrom >= dateTo) {
    dateFrom = subMonths(dateTo, 1)
  }
  const assayIds = await allAssayToId()

  const queryForm = await knex('FormType AS ft')
    .join('FormDefinition as fd', 'fd.formTypeId', 'ft.id')
    .join('FormDefinitionSchema as fschema', 'fd.formDefinitionSchemaId', 'fschema.id')
    .innerJoin('Disease as d', 'fd.diseaseId', 'd.id')
    .where('fd.partnerId', partnerId)
    .where('ft.externalId', 'gxConnectForm')
    .where('d.externalId', 'tb') // <-- includes MTB and MTB-Ultra
    .distinct(
      'fd.externalId',
      'fd.assayId',
      'fd.diseaseId',
      'ft.externalId as formTypeId',
      knex.raw("REPLACE(fschema.jsonSchemaFile, '.json', '') as jsonSchemaFileName")
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
                IFNULL(r.patientData ->> '$.${fieldName}', '') IN ('', 'null')
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
       *    WHEN IFNULL(r.patientData ->> '$.${fieldName}', '') IN ('', 'null')
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

module.exports = {
  getDataForReportDrTb10A,
  getDataForReportDrTb10B,
  getDataForReportCovid19,
  getReportDrTb10a10bCovidNtpUse,
  getReportCustomFieldsCompletion,
}
