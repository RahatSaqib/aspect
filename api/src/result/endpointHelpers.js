const Joi = require('@hapi/joi')
const {
  validateAllGeographyFilterParams,
} = require('../geography/requestValidation')
const { validateDateRangeParams, validateSortPageParams } = require('../routes')
// -----------------------------------------------------
// helper functions
// -----------------------------------------------------
function listResultsBaseConfig() {
  return {
    auth: { scope: ['result'] },
    timeout: {
      server: 360000,
      socket: false,
    },
    validate: {
      query: {
        deviceId: Joi.number()
          .allow('')
          .description('Filter for device ID'),
        assayId: Joi.number()
          .allow('')
          .description('Filter for assay ID'),
        resultCategoryId: Joi.number()
          .allow('')
          .description('Result-1 Category ID'),
        resultCategory2Id: Joi.number()
          .allow('')
          .description('Result-2 Category ID'),
        errorCode: Joi.string()
          .allow('')
          .description('Filter error code'),
        deviceName: Joi.string()
          .allow('')
          .description('Filter for device name'),
        siteName: Joi.string()
          .allow('')
          .description('Filter for site name'),
        patientOrResearchId: Joi.string()
          .allow('')
          .description('Filter for patient/research ID'),
        sampleId: Joi.string()
          .allow('')
          .description('Filter for sample ID'),
        sampleOriginSite: Joi.string()
          .allow('')
          .description('Filter for sample origin site ID'),
        workflowStatusId: Joi.number()
          .allow('')
          .description('Filter for Result Workflow Status ID'),
        treatmentStatusId: Joi.number()
          .allow('')
          .description('Filter for Result Treatment Status ID'),
        jsonFields: Joi.array()
          .max(10)
          .items(Joi.string().max(50))
          .single()
          .description(
            'Specify which fields to select from the resultDataJSON'
          ),
        // query param 'format' is applicable only for handler 'exportDevices'
        format: Joi.string()
          .allow('')
          .description('File format for exporting data'),
        ...validateAllGeographyFilterParams(),
        ...validateDateRangeParams(),
        ...validateSortPageParams(),
        // transfer result
        reportableSiteName: Joi.string()
          .allow('', null)
          .description(
            'The name of reportable site, differ from siteName when transferred'
          ),
        transferredOn: Joi.date()
          .allow(null)
          .description('When result was transferred to another clinic'),
        transferredBy: Joi.string()
          .allow(null)
          .description('Who transferred result to another clinic'),
        resultStatusLogId: Joi.number()
          .allow(null)
          .integer()
          .positive()
          .description(
            'The id of last entry in ResultStatusLog for current result'
          ),
        caseId: Joi.string()
          .allow('')
          .optional()
          .description(
            'Case externalid for filtering only Results related with'
          ),
      },
    },
  }
}

// -----------------------------------------------------
function getResponseForComments() {
  return {
    options: {
      allowUnknown: false,
    },
    schema: Joi.object().keys({
      ok: Joi.bool()
        .required()
        .description('False if there was some sort of error'),
      length: Joi.number().required(),
      data: Joi.array()
        .required()
        .description('The result comments')
        .items(
          Joi.object().keys({
            id: Joi.number()
              .required()
              .description('Unique ID of the comment'),
            text: Joi.string()
              .required()
              .description('Comment text'),
            createdBy: Joi.string().description(
              'User name who created comment'
            ),
            createdOn: Joi.date()
              .required()
              .description('When comment was created'),
            changedOn: Joi.date()
              .required()
              .description('When comment was updated'),
            noteType: Joi.string()
              .required()
              .description('Comment type'),
          })
        ),
    }),
  }
}
// -----------------------------------------------------
const resultAggregationsValidGroups = [
  'resultCategory1',
  'resultCategory2',
  'week',
  'month',
  'year',
  'gender',
  'age',
  'state',
  'day',
]
const clinicalIndicatorsValidGroups = [...resultAggregationsValidGroups]
const followUpAggregationsValidGroups = [
  ...resultAggregationsValidGroups,
  'followUp',
]
const getResultAggregationsValidate = validGroups => ({
  ...validateDateRangeParams(),
  assayType: Joi.string()
    .allow('')
    .description('Filter for assay type'),
  assay: Joi.alternatives()
    .try(Joi.array(), Joi.string())
    .description('Filter for assay'),
  resultCategory1: Joi.string()
    .allow('')
    .description('Filter for result category 1'),
  resultCategory2: Joi.string()
    .allow('')
    .description('Filter for result category 2'),
  siteName: Joi.string()
    .allow('')
    .description('Filter for site'),
  deviceName: Joi.string()
    .allow('')
    .description('Filter for device'),
  groupBy: Joi.alternatives()
    .allow('', null)
    .try(
      Joi.array().items(Joi.string().valid(validGroups)),
      Joi.string().valid(validGroups)
    )
    .description('Array of fields to group by'),
})

const resultAggregationsResponseItem = {
  cnt: Joi.number()
    .required()
    .description('The count of results in the group'),
  resultCategory1: Joi.string()
    .allow(null)
    .description('Result Category 1 that count is grouped by'),
  resultCategory2: Joi.string()
    .allow(null)
    .description('Result Category 2 that count is grouped by'),
  week: Joi.string().description('The week that the count is grouped by'),
  month: Joi.string().description('The month that the count is grouped by'),
  year: Joi.string().description('The year that the count is grouped by'),
  day: Joi.string().description('The day that the count is grouped by'),
  gender: Joi.string()
    .allow(null)
    .description('The gender that the count is grouped by'),
  age: Joi.number()
    .allow(null)
    .description('The age that the count is grouped by'),
  state: Joi.string()
    .allow(null)
    .description('The state that the count is grouped by'),
}

module.exports = {
  resultAggregationsResponseItem,
  getResultAggregationsValidate,
  clinicalIndicatorsValidGroups,
  followUpAggregationsValidGroups,
  getResponseForComments,
  listResultsBaseConfig,
}
