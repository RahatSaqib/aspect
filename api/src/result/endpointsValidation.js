const Joi = require('@hapi/joi')
const { validateDateRangeParams, validateSortPageParams } = require('../routes')

const {
  validateAllGeographyFilterParams,
} = require('../geography/requestValidation')

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
      Joi.array().items(Joi.string().valid(...validGroups)),
      Joi.string().valid(...validGroups)
    )
    .description('Array of fields to group by'),
})

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

const resultUpdatePayload = {
  endedOn: Joi.date()
    .iso()
    .required()
    .description('When the result was ready'),
  sampleId: Joi.string()
    .max(500)
    .allow('', null)
    .description('Sample ID'),
  sampleTypeId: Joi.number()
    .allow(null)
    .description('Sample type (Plasma, Sputum, etc.)'),
  sampleCollectedOn: Joi.date()
    .iso()
    .allow(null)
    .description('When the sample was collected'),
  sampleOriginSiteId: Joi.number()
    .allow(null)
    .description('Where the sample was collected'),
  patientId: Joi.string()
    .max(500)
    .allow('', null)
    .description('Patient ID'),
  patientCaseId: Joi.string()
    .max(500)
    .allow('', null)
    .description('Case ID'),
  resultCategory1: Joi.number()
    .required()
    .description('The result of the test'),
  resultCategory2: Joi.number()
    .allow(null)
    .description('The result of the test'),
  tags: Joi.string()
    .max(500)
    .allow('')
    .description('Tags for the result'),
  formData: Joi.object()
    .allow('', null)
    .description('Form data to save along with the result'),
}

const resultCreatePayload = {
  siteId: Joi.number()
    .required()
    .description('The site where the test was run'),
  deviceId: Joi.number()
    .allow(null)
    .description('The device that ran the test'),
  assayId: Joi.number()
    .required()
    .description('The assay of the test that was run'),
  ...resultUpdatePayload,
}

const baseResultResponse = {
  id: Joi.number()
    .required()
    .description('Unique ID of the result for this instance of Aspect'),
  deviceName: Joi.string()
    .allow('')
    .description('Filter for device name'),
  sampleId: Joi.string()
    .allow(null)
    .description('Sample id'),
  externalId: Joi.string()
    .allow(null)
    .description('Unique ID of the result for this diagnostic device'),
  startedOn: Joi.date()
    .allow(null)
    .description(
      'When sample processing started. Note that the zone designator is empty because this is the local date/time as reported by the device. This should be shown as is and not converted to the user time zone.'
    ),
  endedOn: Joi.date()
    .allow(null)
    .description(
      'When sample processing ended. Note that the zone designator is empty because this is the local date/time as reported by the device. This should be shown as is and not converted to the user time zone.'
    ),
  stateName: Joi.string()
    .allow(null)
    .description("The device's state name"),
  resultCategory1Name: Joi.string()
    .allow(null)
    .description("The result's category 1 name"),
  resultCategory2Name: Joi.string()
    .allow(null)
    .description("The result's category 2 name"),
  siteName: Joi.string()
    .allow(null)
    .description('The name of the site'),
  assayId: Joi.number()
    .integer()
    .description('The id of the assay'),
  sampleOriginSiteName: Joi.string()
    .allow(null)
    .description('Sample original site name'),
  patientId: Joi.string()
    .allow(null)
    .description('The patient Id'),
  treatmentStatusInfo: Joi.string()
    .allow(null, '')
    .description('treatment status info'),
  errorCode: Joi.string()
    .allow(null)
    .description(
      'If an error occurred, contains the error code from the device'
    ),
  resultWorkflowStatus: Joi.string()
    .allow(null)
    .description("The result's Workflow status name"),
  caseExternalId: Joi.string()
    .optional()
    .allow(null, '')
    .description('The id of the case'),
  diseaseId: Joi.number()
    .positive()
    .required()
    .description('the Id of the disease'),
  diseaseName: Joi.string()
    .required()
    .description('the name of the disease'),
  diseaseExternalId: Joi.string()
    .required()
    .description('the external id of the disease'),
}

function validateResultListResponse() {
  return {
    ...baseResultResponse,
    assayName: Joi.string()
      .description('The name of the assay performed to this result')
      .allow('', null),
    resultText: Joi.string()
      .description('The Text of the result')
      .allow('', null),
    resultTreatmentStatus: Joi.string()
      .description('The status of the result treatment')
      .optional()
      .allow('', null),
  }
}

function validateResultDetailResponse() {
  return {
    ...baseResultResponse,

    createdOn: Joi.date()
      .required()
      .description(
        'When the result was added to the Aspect database. This can be converted to the user time zone.'
      ),
    updatedOn: Joi.date()
      .required()
      .description(
        'When the result was last updated in the Aspect database. This can be converted to the user time zone.'
      ),
    deviceId: Joi.number()
      .integer()
      .positive()
      .required()
      .description('Device id in aspect'),
    deviceSerial: Joi.string()
      .allow(null, '')
      .description('The device serial number'),
    countryName: Joi.string().description("The device's country name"),
    stateName: Joi.string()
      .allow(null)
      .description("The device's state name"),
    lgaName: Joi.string()
      .allow(null)
      .description("The device's lga name"),
    resultWorkflowChangedOn: Joi.date()
      .allow(null)
      .description('The date when status was changed'),
    resultCategory1Name: Joi.string()
      .allow(null)
      .description("The result's category 1 name"),
    resultCategory2Name: Joi.string()
      .allow(null)
      .description("The result's category 2 name"),
    resultWorkflowStatusId: Joi.number()
      .integer()
      .description("The result's workflow status id"),
    resultWorkflowStatus: Joi.string()
      .allow(null)
      .description("The result's Workflow status name"),
    resultWorkflowStatusExternalId: Joi.string()
      .allow(null)
      .description("The result's Workflow status name"),
    resultData: Joi.object().description('The result data'),
    files: Joi.array().description('Result Files'),
    formData: Joi.object()
      .allow(null)
      .description('The form data'),
    siteId: Joi.number()
      .integer()
      .positive()
      .description('The id of the site'),
    resultTreatmentStatusCreatedBy: Joi.string()
      .allow(null)
      .description('The name of the user that created the note'),
    siteName: Joi.string()
      .allow(null)
      .description('The name of the site'),
    assayVersion: Joi.string()
      .allow(null)
      .description('The assay Version'),
    consumableSerial: Joi.string()
      .allow(null)
      .description('The consumable serial'),
    instrumentalSerial: Joi.string()
      .allow(null)
      .description('The instrumental serial'),
    consumableLot: Joi.string()
      .allow(null)
      .description('The consumable lot'),
    instrumentSerial: Joi.string()
      .allow(null)
      .description('Instrumental serial number'),
    moduleName: Joi.string()
      .allow(null)
      .description('The module name'),
    moduleSerial: Joi.string()
      .allow(null)
      .description('The module serial'),
    researchId: Joi.string()
      .allow(null)
      .description('The research id'),
    senderVersion: Joi.string()
      .allow(null)
      .description('The sender version'),
    senderOperator: Joi.string()
      .allow(null)
      .description('The sender operator'),
    consumableExpirationDate: Joi.date()
      .allow(null)
      .description('The consumable expiration date'),
    notes: Joi.string()
      .allow(null)
      .description('Any notes entered for the sample'),
    errorCode: Joi.string()
      .allow(null)
      .description(
        'If an error occurred, contains the error code from the device'
      ),
    errorNotes: Joi.string()
      .allow(null)
      .description('Contains any details about the error'),
    assayId: Joi.number()
      .integer()
      .description('The id of the assay'),
    sampleOriginSiteId: Joi.number()
      .allow(null)
      .integer()
      .description('the id of the original site'),
    sampleId: Joi.string()
      .allow(null)
      .description('Sample id'),
    sampleGroup: Joi.string()
      .allow(null)
      .description('Sample group'),
    sampleCollectedOn: Joi.date()
      .allow(null)
      .description('The date when the sample has been collected'),
    sampleOriginSiteName: Joi.string()
      .allow(null)
      .description('Sample original site name'),
    sampleTypeName: Joi.string()
      .allow(null)
      .description('Sample type name'),
    patientId: Joi.string()
      .allow(null)
      .description('The patient Id'),
    patientData: Joi.object()
      .allow(null)
      .description('The patient data'),
    formSchema: Joi.object()
      .allow(null)
      .description('The form data object'),
    assay: Joi.object()
      .allow(null)
      .description('The assay object'),
    treatmentStatus: Joi.object()
      .allow(null)
      .description('The treatment status object'),
    resultWorkflowLogReason: Joi.string()
      .allow(null)
      .description('Value of Reason from latest ResultWorkflowLog'),
    resultWorkflowLogOperator: Joi.string()
      .allow(null)
      .description('Operator from the latest ResultWorkflowLog'),
    resultWorkflowLogCreatedOn: Joi.date()
      .allow(null)
      .description('CreatedOn date from the latest ResultWorkflowLog'),
    resultTreatmentStatusChangedOn: Joi.date()
      .allow(null)
      .description('ChangedOn date from the latest ResultTreatmentStatusLog'),
    resultTreatmentStatusCreatedOn: Joi.date()
      .allow(null)
      .description('CreatedOn date from the latest ResultTreatmentStatusLog'),
    resultWorkflowLogChangedOn: Joi.date()
      .allow(null)
      .description('ChangedOn date from the latest ResultWorkflowLog'),
    resultTreatmentStatusId: Joi.number()
      .allow(null)
      .description('ID of the result treatment status'),
    resultTreatmentMethod: Joi.string()
      .allow(null, '')
      .description('Method from latest ResultTreatmentWorkflowLog'),
    resultTreatmentStatus: Joi.string()
      .allow(null, '')
      .description('ExternalId of the result treatment status'),
    treatmentStatusInfo: Joi.string()
      .allow(null, '')
      .description('treatment status info'),
    resultTreatmentData: Joi.string()
      .allow(null, '')
      .description('Operator from latest ResultTreatmentWorkflowLog'),
    resultNotes: Joi.array().description('List of result notes'),
    requiresTreatment: Joi.number()
      .allow(null, '')
      .description('Predicted required treatment'),
    patientCaseId: Joi.number()
      .allow(null)
      .optional()
      .description('Case ID for the result.'),
    followUps: Joi.array()
      .description('Result Follow Ups')
      .items(
        Joi.object().keys({
          id: Joi.number()
            .required()
            .description('Result follow up ID'),
          externalId: Joi.string()
            .allow(null, '')
            .description('External ID of the follow up'),
          date: Joi.date()
            .allow(null)
            .description('When the follow up started'),
          createdOn: Joi.date()
            .required()
            .description('When the follow up was first created in Aspect'),
          updatedOn: Joi.date()
            .required()
            .description('When the follow up was last updated in Aspect'),
          followUpExternalId: Joi.string()
            .required()
            .description('External ID of the follow up'),
          followUpName: Joi.string()
            .required()
            .description('Name of the follow up'),
          followUpi18nKey: Joi.string()
            .required()
            .description('Translation key for the follow up'),
          followUpTypeName: Joi.string()
            .required()
            .description('Name of the follow up type'),
          followUpTypeExternalId: Joi.string()
            .required()
            .description('External ID of the follow up type'),
          followUpTypei18nKey: Joi.string()
            .required()
            .description('Translation key for the follow up type'),
        })
      ),
    // transfer result
    reportableSiteId: Joi.number()
      .allow(null)
      .integer()
      .positive()
      .description(
        'The id of reportable site, differ from siteId when transferred'
      ),
    reportableSiteName: Joi.string()
      .allow(null)
      .description(
        'The name of reportable site, differ from siteName when transferred'
      ),
    transferredOn: Joi.date()
      .allow(null)
      .description('When result was transferred to another clinic'),
    firstViewedOn: Joi.date()
      .allow(null)
      .description('When transferred result was clicked'),
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
    canEdit: Joi.number()
      .allow(null)
      .description(
        "Is the result's assay configured to allow editing of results?"
      ),
    canDelete: Joi.number()
      .allow(null)
      .description(
        "Is the result's assay configured to allow deleting of results?"
      ),
  }
}

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
        diseaseId: Joi.number()
          .integer()
          .positive()
          .optional()
          .description('The disease ID'),
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

module.exports = {
  listResultsBaseConfig,
  getResponseForComments,
  getResultAggregationsValidate,
  clinicalIndicatorsValidGroups,
  resultAggregationsResponseItem,
  followUpAggregationsValidGroups,
  validateResultListResponse,
  validateResultDetailResponse,
  resultCreatePayload,
  resultUpdatePayload,
}
