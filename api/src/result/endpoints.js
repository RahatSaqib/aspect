const Joi = require('joi')
const {
  asyncHandler,
  validateDateRangeParams,
  validateSortPageParams,
} = require('../routes')
const {
  listResults,
  downloadResultsList,
  showResult,
  listResultTypes,
  updateWorkflowStatus,
  updateQcCheck,
  updateFormData,
  listWorkflowStatusTypes,
  listWorkflowStatusLog,
  exportResults,
  showDeviceLogs,
  showFileReferences,
  downloadFile,
  downloadFirstImage,
} = require('./service')
const {
  validateAllGeographyFilterParams,
} = require('../geography/requestValidation')

function listResultsBaseConfig() {
  return {
    auth: { scope: ['result:view', 'result:edit'] },
    validate: {
      query: Object.assign(
        {
          deviceId: Joi.number()
            .allow('')
            .description('Filter for device ID'),
          assayId: Joi.number()
            .allow('')
            .description('Filter for assay ID'),
          resultCategoryId: Joi.number()
            .allow('')
            .description('Result Category ID'),
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
          sampleGroup: Joi.string()
            .allow('')
            .description('Filter for sample group'),
          sampleOriginSite: Joi.string()
            .allow('')
            .description('Filter for sample origin site ID'),
          workflowStatusId: Joi.number()
            .allow('')
            .description('Filter for Result Workflow Status ID'),
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
        },
        validateAllGeographyFilterParams(),
        validateDateRangeParams(),
        validateSortPageParams()
      ),
    },
  }
}

const routes = [
  {
    method: 'GET',
    path: '/result',
    handler: asyncHandler(listResults),
    config: Object.assign(
      {
        description: 'Result List',
        notes: 'Pageable and sortable list of results',
      },
      listResultsBaseConfig()
    ),
  },
  {
    method: 'GET',
    path: '/result/{resultId}',
    handler: asyncHandler(showResult),
    config: {
      description: 'Result Detail',
      notes: 'Details of a result',
      auth: { scope: ['result:view', 'result:edit'] },
      validate: {
        params: {
          resultId: Joi.string()
            .description('Result ID')
            .required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/result/device-logs/{resultId}',
    handler: asyncHandler(showDeviceLogs),
    config: {
      description: 'Device Logs',
      notes: 'Device Logs by result id',
      auth: { scope: ['result:view', 'result:edit'] },
      validate: {
        params: {
          resultId: Joi.string()
            .description('Result ID')
            .required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/result/files/{resultId}',
    handler: asyncHandler(showFileReferences),
    config: {
      description: 'File References',
      notes: 'File References by result id',
      auth: { scope: ['result:view', 'result:edit'] },
      validate: {
        params: {
          resultId: Joi.string()
            .description('Result ID')
            .required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/result/file/{resultId}/{fileReferenceId}/{fileName}',
    handler: downloadFile,
    config: {
      description: 'Download file',
      notes: 'Downloads the last file for the result with given name',
      auth: { scope: ['result:view', 'result:edit'] },
      validate: {
        params: {
          resultId: Joi.string()
            .description('File Reference ID')
            .required(),
          fileReferenceId: Joi.string()
            .description('File Reference ID')
            .required(),
          fileName: Joi.string()
            .description('FileName')
            .required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/result/image/{resultId}',
    handler: downloadFirstImage,
    config: {
      description: 'Download first image',
      notes: 'Downloads the first image for the result',
      auth: { scope: ['result:view', 'result:edit'] },
      validate: {
        params: {
          resultId: Joi.string()
            .description('File Reference ID')
            .required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/result/result-types',
    handler: asyncHandler(listResultTypes),
    config: {
      description: 'Result Type List',
      notes: 'Pageable and sortable list of results types',
      auth: { scope: ['result:view', 'result:edit'] },
      validate: {
        query: Object.assign(
          {
            name: Joi.string()
              .allow('')
              .description('Filter for result type name'),
          },
          validateSortPageParams('name')
        ),
      },
    },
  },
  {
    method: 'PUT',
    path: '/result/workflow-status/{resultId}',
    handler: asyncHandler(updateWorkflowStatus),
    config: {
      description: 'Update Result Status',
      notes: 'Update the status of a result',
      auth: { scope: ['result:edit'] },
      validate: {
        params: {
          resultId: Joi.number()
            .integer()
            .positive()
            .description('Result Id'),
        },
        payload: {
          resultWorkflowStatusId: Joi.number()
            .integer()
            .allow(null),
          externalId: Joi.string().allow('', null),
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/result/qc-check/{resultId}',
    handler: asyncHandler(updateQcCheck),
    config: {
      description: 'Update QC Check Flag',
      notes: 'Update the QC Check flag of a result',
      auth: { scope: ['result:edit'] },
      validate: {
        params: {
          resultId: Joi.number()
            .integer()
            .positive()
            .description('Result Id'),
        },
        payload: {
          qcCheck: Joi.boolean(),
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/result/form-data/{resultId}',
    handler: asyncHandler(updateFormData),
    config: {
      description: 'Update form data for the result',
      notes: 'Update form data for the result',
      auth: { scope: ['result:edit'] },
      validate: {
        params: {
          resultId: Joi.number()
            .integer()
            .positive()
            .description('Result Id'),
        },
        payload: Joi.object(),
      },
    },
  },
  {
    method: 'GET',
    path: '/result/workflow-status-types',
    handler: asyncHandler(listWorkflowStatusTypes),
    config: {
      description: 'Result Workflow Status List',
      notes: 'Dictionary set of Result Workflow Status options',
      auth: { scope: ['result:view', 'result:edit'] },
    },
  },
  {
    method: 'GET',
    path: '/result/workflow-status-logs/{resultId}',
    handler: asyncHandler(listWorkflowStatusLog),
    config: {
      description: 'Result Workflow Status Logs',
      notes:
        'Pageable and sortable list of workflow status logs for current result',
      auth: { scope: ['result:view', 'result:edit'] },
      validate: {
        query: validateSortPageParams(),
        params: {
          resultId: Joi.string()
            .description('Result ID')
            .required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/result/export',
    handler: asyncHandler(exportResults),
    config: Object.assign(
      {
        description: 'Export Result List into Excel or CSV',
        notes: 'Filtered and sorted list of devices',
      },
      listResultsBaseConfig()
    ),
  },
  {
    method: 'GET',
    path: '/result/download',
    handler: asyncHandler(downloadResultsList),
    config: Object.assign({
      description: 'Result Sync',
      notes:
        'Pageable and sortable list of complete results (including all result details). Used for syncing the reporter app',
      auth: { scope: ['result:view', 'result:edit'] },
      validate: {
        query: Object.assign(
          {
            minUpdatedOn: Joi.date()
              .iso()
              .allow(null)
              .description('Updated From Date'),
            maxUpdatedOn: Joi.date()
              .iso()
              .allow(null)
              .description('Updated To Date'),
          },
          validateSortPageParams('updatedOn')
        ),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool()
            .required()
            .description('False if there was some sort of error'),
          total: Joi.number()
            .required()
            .description(
              'The total number of results that match the given filters'
            ),
          length: Joi.number()
            .required()
            .description('The number of results included in this response'),
          data: Joi.array()
            .required()
            .description('The results')
            .items(
              Joi.object().keys({
                id: Joi.number()
                  .required()
                  .description(
                    'Unique ID of the result for this instance of Aspect'
                  ),
                externalId: Joi.string()
                  .required()
                  .description(
                    'Unique ID of the result for this diagnostic device'
                  ),
                startedOn: Joi.date()
                  .required()
                  .description(
                    'When sample processing started. Note that the zone designator is empty because this is the local date/time as reported by the device. This should be shown as is and not converted to the user time zone.'
                  ),
                endedOn: Joi.date()
                  .required()
                  .description(
                    'When sample processing ended. Note that the zone designator is empty because this is the local date/time as reported by the device. This should be shown as is and not converted to the user time zone.'
                  ),
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
                longitude: Joi.number()
                  .allow(null)
                  .description(
                    'Longitude of the device at the time the sample was processed'
                  ),
                latitude: Joi.number()
                  .allow(null)
                  .description(
                    'Latitude of the device at the time the sample was processed'
                  ),
                assayExternalId: Joi.string()
                  .required()
                  .description('Unique ID of the Assay'),
                siteName: Joi.string()
                  .required()
                  .description(
                    'Name of the site where the device was located when the sample was processed'
                  ),
                deviceName: Joi.string()
                  .required()
                  .description('Name of the device'),
                resultCategory1ExternalId: Joi.string()
                  .allow(null)
                  .description('Category of the first result'),
                resultCategory2ExternalId: Joi.string()
                  .allow(null)
                  .description('Category of the second result'),
                workflowStatus: Joi.object()
                  .description('Current workflow status of the result')
                  .keys({
                    changedOn: Joi.date().description(
                      'Date of the latest change to the workflow status'
                    ),
                    externalId: Joi.string().description(
                      'External ID of the workflow status'
                    ),
                    i18nKey: Joi.string().description(
                      'i18nKey ID of the workflow status'
                    ),
                    name: Joi.string().description(
                      'Name of the workflow status'
                    ),
                    reason: Joi.string()
                      .description(
                        'Reason for the latest workflow status change'
                      )
                      .allow(null, ''),
                  }),
                treatmentStatus: Joi.object()
                  .allow(null)
                  .description('Current treatment status of the result')
                  .keys({
                    changedOn: Joi.date().description(
                      'Date of the latest change to the treatment status'
                    ),
                    externalId: Joi.string().description(
                      'External ID of the treatment status'
                    ),
                    i18nKey: Joi.string().description(
                      'i18nKey ID of the treatment status'
                    ),
                    name: Joi.string().description(
                      'Name of the treatment status'
                    ),
                  }),
                patientData: Joi.object()
                  .allow(null)
                  .description('Data about the patient'),
                resultData: Joi.object()
                  .allow(null)
                  .description('Data about the result'),
                researchId: Joi.string()
                  .allow(null)
                  .description('An optional research ID for the patient'),
                formData: Joi.object()
                  .allow(null)
                  .description('Form data that was entered in the Aspect UI'),
                senderVersion: Joi.string()
                  .allow(null)
                  .description('Version of the device software'),
                senderOperator: Joi.string()
                  .allow(null)
                  .description('Operator of the device'),
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
                sample: Joi.object()
                  .description('The sample that the result is based on')
                  .keys({
                    id: Joi.date().description('ID of the sample'),
                    collectedOn: Joi.date().description(
                      'When the sample was collected'
                    ),
                    group: Joi.string().description(
                      'The group of samples that this sample is a part of'
                    ),
                    type: Joi.string().description(
                      'Type of the sample ("DBS", "Sputum", etc.)'
                    ),
                    originSite: Joi.object()
                      .description('The site where the sample was taken')
                      .keys({
                        externalId: Joi.string().description('ID of the site'),
                        name: Joi.string().description('Name of the site'),
                      }),
                  }),
              })
            ),
        }),
      },
    }),
  },
]

module.exports = { routes }
