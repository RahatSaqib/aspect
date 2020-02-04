const Joi = require('@hapi/joi')
const {
  asyncHandler,
  validateDateRangeParams,
  validateSortPageParams,
  validateResultResponse,
} = require('../routes')
const {
  listResults,
  downloadResultsList,
  showResult,
  listResultTypes,
  updateWorkflowStatus,
  updateTreatmentStatusPost,
  listTreatmentStatusTypes,
  updateFormData,
  listWorkflowStatusTypes,
  listWorkflowStatusLog,
  showDeviceLogs,
  showFileReferences,
  downloadFile,
  downloadFirstImage,
  confirmedTreatmentTracking,
  listFollowUps,
  setResultFollowUp,
  updateResultFollowUp,
  deleteResultFollowUp,
  addResultNote,
  allResultNotes,
  deleteResultNote,
  transferResult,
  updateTransferNotification,
} = require('./service')
const { getPatientResultsDetails } = require('./patientResultDetailService')
const { getResultsReport } = require('./serviceReport')
const {
  validateAllGeographyFilterParams,
} = require('../geography/requestValidation')
// -----------------------------------------------------
// helper functions
// -----------------------------------------------------
function listResultsBaseConfig() {
  return {
    auth: { scope: ['result:view', 'result:edit'] },
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
          .description('Result Category ID'),
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
// routes
// -----------------------------------------------------
const routes = [
  {
    method: 'GET',
    path: '/result',
    handler: asyncHandler(listResults),
    config: {
      description: 'Result List',
      notes: 'Pageable and sortable list of results',
      ...listResultsBaseConfig(),
    },
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
        query: {
          name: Joi.string()
            .allow('')
            .description('Filter for result type name'),
          ...validateSortPageParams('name'),
        },
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
          updatedOn: Joi.date()
            .iso()
            .allow(null)
            .description('Status updated date'),
          externalId: Joi.string().allow('', null),
          reason: Joi.string()
            .description('Reason for the latest workflow status change')
            .allow(null, '')
            .max(255),
          operator: Joi.string()
            .description('The sender operator')
            .allow(null, '')
            .max(255),
          changedOn: Joi.date()
            .description('Date when the status was updated.')
            .iso()
            .allow(null),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool()
            .required()
            .description('False if there was some sort of error'),
          data: Joi.object()
            .required()
            .description('The results')
            .keys(validateResultResponse()),
        }),
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
    method: 'PUT',
    path: '/result/transfer/{resultId}',
    handler: asyncHandler(updateTransferNotification),
    config: {
      description: 'Update first viewOn field for transfer result',
      notes: 'Update first viewOn field for transfer result',
      auth: { scope: ['result:edit'] },
      validate: {
        params: {
          resultId: Joi.number()
            .integer()
            .positive()
            .description('Result Id'),
        },
        payload: {
          firstViewedOn: Joi.date()
            .required()
            .description('first viewed date'),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool()
            .required()
            .description('False if there was some sort of error'),
          data: Joi.object()
            .required()
            .description('Return current result')
            .keys(validateResultResponse()),
        }),
      },
    },
  },
  {
    method: 'POST',
    path: '/result/result-note/{resultId}',
    handler: asyncHandler(addResultNote),
    config: {
      description: 'Add result note to result',
      notes: 'Add result note to result',
      auth: { scope: ['result:edit'] },
      validate: {
        params: {
          resultId: Joi.number()
            .integer()
            .positive()
            .required()
            .description('Result Id'),
        },
        payload: {
          note: Joi.string(),
          resultNoteType: Joi.string().allow('', null),
          commentId: Joi.number()
            .integer()
            .positive()
            .allow(null)
            .description('Comment Id to update'),
          changedOn: Joi.date()
            .description('Date when the note was added/edited.')
            .iso()
            .allow(null),
        },
      },
      response: getResponseForComments(),
    },
  },
  {
    method: 'GET',
    path: '/result/result-all-notes/{resultId}',
    handler: asyncHandler(allResultNotes),
    config: {
      description: 'Get all notes for specified result ',
      notes: 'Get all notes for specified result',
      auth: { scope: ['result:view', 'result:edit'] },
      validate: {
        params: {
          resultId: Joi.number()
            .integer()
            .positive()
            .required()
            .description('Result Id'),
        },
      },
      response: getResponseForComments(),
    },
  },
  {
    method: 'DELETE',
    path: '/result/result-note/{resultId}/{commentId}',
    handler: asyncHandler(deleteResultNote),
    config: {
      description: 'Remove a specified comment from a result',
      notes: 'Removes a specified comment from a result',
      auth: { scope: ['result:view', 'result:edit'] },
      validate: {
        params: {
          resultId: Joi.number()
            .required()
            .integer()
            .positive()
            .description('Result ID'),
          commentId: Joi.number()
            .required()
            .integer()
            .positive()
            .description('Result Comment ID'),
        },
      },
      response: getResponseForComments(),
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
    handler: getResultsReport,
    config: {
      description: 'Export Result List into Excel or CSV',
      notes: 'Filtered and sorted list of devices',
      ...listResultsBaseConfig(),
    },
  },
  {
    method: 'GET',
    path: '/result/download',
    handler: asyncHandler(downloadResultsList),
    config: {
      description: 'Result Sync',
      notes:
        'Pageable and sortable list of complete results (including all result details). Used for syncing the reporter app',
      auth: { scope: ['result:view', 'result:edit'] },
      validate: {
        query: {
          minUpdatedOn: Joi.date()
            .iso()
            .allow(null)
            .description('Updated From Date'),
          maxUpdatedOn: Joi.date()
            .iso()
            .allow(null)
            .description('Updated To Date'),
          patientSample: Joi.string()
            .optional()
            .description(
              'Is the string for look for the patient. this string could be the patient id, the sample id or the patient name'
            ),
          assayExternalIds: Joi.string()
            .optional()
            .description('a csv string with the assay externalId'),
          resultCategories: Joi.string()
            .optional()
            .description('an array with the assay type abbreviation'),
          workflowStatus: Joi.string()
            .optional()
            .description('External Id of the workflow status'),
          treatmentStatus: Joi.string()
            .optional()
            .description('External Id of the treatment status'),
          deviceType: Joi.string()
            .optional()
            .description(
              'External Id Device type, the default value is CepheidGeneXpert'
            ),
          isTransferred: Joi.boolean()
            .optional()
            .allow(null)
            .description('True to search only among Transferred results'),
          ...validateSortPageParams('updatedOn'),
        },
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
                    createdOn: Joi.date().description(
                      'Date of creation of the workflow status'
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
                    setDelivered: Joi.boolean()
                      .optional()
                      .allow(null)
                      .description('Tells if the record was updated manually'),
                  }),
                treatmentStatus: Joi.object()
                  .allow(null)
                  .description('Current treatment status of the result')
                  .keys({
                    changedOn: Joi.date()
                      .description(
                        'Date of the latest change to the treatment status'
                      )
                      .allow(null),
                    externalId: Joi.string()
                      .description('External ID of the treatment status')
                      .allow(null),
                    i18nKey: Joi.string()
                      .description('i18nKey ID of the treatment status')
                      .allow(null),
                    name: Joi.string()
                      .description('Name of the treatment status')
                      .allow(null),
                    method: Joi.string()
                      .description(
                        'The method that was used to update the treatment status'
                      )
                      .allow(null),
                    data: Joi.string()
                      .description(
                        'Any additional data related to the treamtent status'
                      )
                      .allow(null),
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
                  .allow(null, '')
                  .description('Any notes entered for the sample'),
                sampleOriginSiteId: Joi.number()
                  .allow(null)
                  .description('Sample Origin Site Id for the patient'),
                firstViewedOn: Joi.date()
                  .allow(null)
                  .description('date when result first viewed'),
                errorCode: Joi.string()
                  .allow(null, '')
                  .description(
                    'If an error occurred, contains the error code from the device'
                  ),
                errorNotes: Joi.string()
                  .allow(null)
                  .description('Contains any details about the error'),
                sample: Joi.object()
                  .description('The sample that the result is based on')
                  .keys({
                    id: Joi.string()
                      .allow(null)
                      .description('ID of the sample'),
                    collectedOn: Joi.date()
                      .allow(null)
                      .description('When the sample was collected'),
                    group: Joi.string()
                      .allow(null)
                      .description(
                        'The group of samples that this sample is a part of'
                      ),
                    type: Joi.string()
                      .allow(null)
                      .description(
                        'Type of the sample ("DBS", "Sputum", etc.)'
                      ),
                    originSite: Joi.object()
                      .allow(null)
                      .description('The site where the sample was taken')
                      .keys({
                        externalId: Joi.string().description('ID of the site'),
                        name: Joi.string().description('Name of the site'),
                      }),
                  }),
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
                        .description(
                          'When the follow up was first created in Aspect'
                        ),
                      updatedOn: Joi.date()
                        .required()
                        .description(
                          'When the follow up was last updated in Aspect'
                        ),
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
                comments: Joi.array()
                  .allow(null)
                  .description('Result comments')
                  .items(
                    Joi.object().keys({
                      id: Joi.number()
                        .required()
                        .description('Result comment ID'),
                      text: Joi.string()
                        .allow(null, '')
                        .description('Comment text'),
                      createdOn: Joi.date()
                        .required()
                        .description('When comment was first created'),
                      createdBy: Joi.string()
                        .allow(null, '')
                        .description('Who added comment'),
                      changedOn: Joi.date()
                        .required()
                        .description('When the comment was last updated'),
                      changedBy: Joi.string()
                        .allow(null, '')
                        .description('Who changed comment'),
                      noteType: Joi.string()
                        .allow(null, '')
                        .description('Type of comment'),
                    })
                  ),
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
                reportableSiteId: Joi.number()
                  .allow(null)
                  .description('Reportable siteId of the patient'),
              })
            ),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/result/treatment-status-types',
    handler: asyncHandler(listTreatmentStatusTypes),
    config: {
      description: 'Result Treatment Status List',
      notes: 'Dictionary set of Result Treatment Status options',
      auth: { scope: ['result:view', 'result:edit'] },
    },
  },
  {
    method: 'PUT',
    path: '/result/treatment-status/{resultId}',
    handler: asyncHandler(updateTreatmentStatusPost),
    config: {
      description: 'Update Result Treatment Status',
      notes: 'Update the treatment status of a result',
      auth: { scope: ['treatmentStatus:edit', 'treatmentStatus:admin'] },
      validate: {
        params: {
          resultId: Joi.number()
            .integer()
            .positive()
            .description('Result Id'),
        },
        payload: {
          resultTreatmentStatusId: Joi.number()
            .integer()
            .positive()
            .allow(null),
          externalId: Joi.string().allow('', null),
          data: Joi.string().allow('', null),
          method: Joi.string().allow('', null),
          changedOn: Joi.date()
            .iso()
            .optional()
            .description(
              'This is the date when the status were updated. This is optional'
            ),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool()
            .required()
            .description('False if there was some sort of error'),
          data: Joi.object()
            .required()
            .description('The results')
            .keys(validateResultResponse()),
        }),
      },
    },
  },
  {
    method: 'POST',
    path: '/result/confirmed-treatment-tracking',
    handler: asyncHandler(confirmedTreatmentTracking),
    config: {
      description: 'Aggregated data for Treatment Graph on dashboard',
      notes:
        'Set of percentages of Confirmed and Unaccountable percentage for few months',
      auth: { scope: ['result:view', 'result:edit'] },
      validate: {
        payload: {
          siteId: Joi.number()
            .integer()
            .allow(null),
          assayTypeId: Joi.number()
            .integer()
            .allow(null),
          resultCategoryId: Joi.number()
            .integer()
            .allow(null),
          endedOn: Joi.date()
            .iso()
            .allow(null)
            .description('Ending date'),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/result/follow-ups',
    handler: asyncHandler(listFollowUps),
    config: {
      description: 'Result Follow Up List',
      notes: 'List of possible result follow ups',
      auth: { scope: ['treatmentStatus:view', 'treatmentStatus:edit'] },
      validate: {
        query: {
          typeId: Joi.number()
            .integer()
            .allow(null)
            .description('ID of the follow up type'),
          assayId: Joi.number()
            .integer()
            .allow(null)
            .description('ID of the assay'),
          resultCategory1: Joi.number()
            .integer()
            .allow(null)
            .description('ID of the first result category'),
          resultCategory2: Joi.number()
            .integer()
            .allow(null)
            .description('ID of the second result category'),
        },
      },
      response: {
        schema: Joi.object().keys({
          ok: Joi.bool()
            .required()
            .description('False if there was some sort of error'),
          total: Joi.number()
            .required()
            .description(
              'The total number of follow-ups that match the given filters'
            ),
          length: Joi.number()
            .required()
            .description('The number of follow-ups included in this response'),
          data: Joi.array()
            .required()
            .description('The possible result follow-ups')
            .items(
              Joi.object().keys({
                id: Joi.number()
                  .required()
                  .description(
                    'Unique ID of the follow up for this instance of Aspect'
                  ),
                name: Joi.string()
                  .required()
                  .description('Name of the follow up'),
                externalId: Joi.string()
                  .required()
                  .description('Unique ID of the follow up'),
                i18nKey: Joi.string()
                  .required()
                  .description('Translation key'),
                type: Joi.object()
                  .description('Type of follow up')
                  .keys({
                    id: Joi.number()
                      .required()
                      .description(
                        'Unique ID of the follow up type for this instance of Aspect'
                      ),
                    name: Joi.string()
                      .required()
                      .description('Name of the follow up type'),
                    externalId: Joi.string()
                      .required()
                      .description('Unique ID of the follow up type'),
                    i18nKey: Joi.string()
                      .required()
                      .description('Translation key'),
                  }),
                assays: Joi.array().items(
                  Joi.object().keys({
                    id: Joi.number()
                      .required()
                      .description(
                        'Unique ID of the assay for this instance of Aspect'
                      ),
                    name: Joi.string()
                      .required()
                      .description('Name of the assay'),
                    externalId: Joi.string()
                      .required()
                      .description('Unique ID of the assay'),
                    i18nKey: Joi.string()
                      .required()
                      .description('Translation key'),
                    resultCategories: Joi.array().items(
                      Joi.object().keys({
                        category1: Joi.object().keys({
                          id: Joi.any()
                            .required()
                            .description('Unique ID of the result category'),
                          name: Joi.string()
                            .required()
                            .description('Name of the assay'),
                          externalId: Joi.string()
                            .required()
                            .description('Unique ID of the assay'),
                          i18nKey: Joi.string()
                            .required()
                            .description('Translation key'),
                        }),
                        category2: Joi.object().keys({
                          id: Joi.number()
                            .required()
                            .description('Unique ID of the result category'),
                          name: Joi.string()
                            .required()
                            .description('Name of the assay'),
                          externalId: Joi.string()
                            .required()
                            .description('Unique ID of the assay'),
                          i18nKey: Joi.string()
                            .required()
                            .description('Translation key'),
                        }),
                      })
                    ),
                  })
                ),
              })
            ),
        }),
      },
    },
  },
  {
    method: 'POST',
    path: '/result/follow-up/{resultId}',
    handler: asyncHandler(setResultFollowUp),
    config: {
      description: 'Add a result follow up',
      notes: 'Adds a treatment/outcome follow up for a result',
      auth: { scope: ['treatmentStatus:edit', 'treatmentStatus:admin'] },
      validate: {
        params: {
          resultId: Joi.number()
            .required()
            .integer()
            .positive()
            .description('Result ID'),
        },
        payload: Joi.object()
          .keys({
            externalId: Joi.string()
              .allow('', null)
              .description(
                'Optional externalId of the result follow up. This is mostly for app-use so apps can uniquely identify a follow up record that they created.'
              ),
            followUpId: Joi.number()
              .integer()
              .positive()
              .allow(null)
              .description('The ID of the follow up'),
            followUpExternalId: Joi.string()
              .allow('', null)
              .description(
                'The externalId of the follow up. Will be used if followUpId is null/empty.'
              ),
            date: Joi.date()
              .iso()
              .optional()
              .allow(null)
              .description('This is the date when the follow up happened'),
          })
          .xor('followUpId', 'followUpExternalId'),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool()
            .required()
            .description('False if there was some sort of error'),
          data: Joi.object()
            .required()
            .description('The results')
            .keys(validateResultResponse()),
        }),
      },
    },
  },
  {
    method: 'PUT',
    path: '/result/follow-up/{resultId}',
    handler: asyncHandler(updateResultFollowUp),
    config: {
      description: 'Set the date of a follow up',
      notes: 'Updates the date of a follow up for a result',
      auth: { scope: ['treatmentStatus:edit', 'treatmentStatus:admin'] },
      validate: {
        params: {
          resultId: Joi.number()
            .required()
            .integer()
            .positive()
            .description('Result ID'),
        },
        payload: Joi.object()
          .keys({
            id: Joi.number()
              .integer()
              .positive()
              .allow(null)
              .description('The ID of the result follow up.'),
            externalId: Joi.string()
              .allow('', null)
              .description(
                'The externalId of the result follow up. Will be used in combination with the result ID to find the result follow up if id is empty'
              ),
            date: Joi.date()
              .iso()
              .optional()
              .allow(null)
              .description('This is the date when the follow up happened'),
            followUpId: Joi.number()
              .integer()
              .positive()
              .allow(null)
              .description('The ID of the follow up'),
            followUpExternalId: Joi.string()
              .allow('', null)
              .description(
                'The externalId of the follow up. Will be used if followUpId is null/empty.'
              ),
          })
          .xor('id', 'externalId'),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool()
            .required()
            .description('False if there was some sort of error'),
          data: Joi.object()
            .required()
            .description('The results')
            .keys(validateResultResponse()),
        }),
      },
    },
  },
  {
    method: 'DELETE',
    path: '/result/follow-up/{resultId}',
    handler: asyncHandler(deleteResultFollowUp),
    config: {
      description: 'Remove a follow up from a result',
      notes: 'Removes a follow up from a result',
      auth: { scope: ['treatmentStatus:edit', 'treatmentStatus:admin'] },
      validate: {
        params: {
          resultId: Joi.number()
            .required()
            .integer()
            .positive()
            .description('Result ID'),
        },
        payload: Joi.object()
          .keys({
            id: Joi.number()
              .integer()
              .positive()
              .allow(null)
              .description('The ID of the result follow up.'),
            externalId: Joi.string()
              .allow('', null)
              .description(
                'The externalId of the result follow up. Will be used in combination with the result ID to find the result follow up if id is empty.'
              ),
          })
          .xor('id', 'externalId'),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool()
            .required()
            .description('False if there was some sort of error'),
          data: Joi.object()
            .required()
            .description('The results')
            .keys(validateResultResponse()),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/result/patientresultsdetails',
    handler: asyncHandler(getPatientResultsDetails),
    config: {
      description: 'Get the patient results with details',
      auth: { scope: ['patient:view', 'patient:edit'] },
      validate: {
        query: {
          patientId: Joi.string()
            .required()
            .description('patient Id'),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool()
            .required()
            .description('False if there was some sort of error'),
          data: Joi.array()
            .items(
              Joi.object().keys({
                resultId: Joi.number()
                  .required()
                  .description('The id of the result'),
                sampleCollectedOn: Joi.date()
                  .iso()
                  .required()
                  .description(
                    'The date when the sample was taken in iso format'
                  ),
                originalSiteName: Joi.string()
                  .required()
                  .description(
                    'The name of the place where the sample was taken'
                  ),
                sampleId: Joi.string()
                  .required()
                  .description('The sample id'),
                resultEndedOn: Joi.date()
                  .iso()
                  .required()
                  .description('The result ended date in iso format'),
                assayAbbreviation: Joi.string()
                  .required()
                  .description('The assay abbreviation name'),
                assayId: Joi.string()
                  .required()
                  .description('The assay id'),
                resultData: Joi.object()
                  .required()
                  .description('The result data'),
                resultSiteName: Joi.string()
                  .required()
                  .description('The result site name'),
                resultNotes: Joi.string()
                  .required()
                  .allow(null)
                  .description('The result notes'),
                resultStatus: Joi.string()
                  .required()
                  .allow(null)
                  .description('The result status'),
                resultStatusLog: Joi.date()
                  .iso()
                  .required()
                  .allow(null)
                  .description('The Result status log date'),
                resultTreatmentStatusLogDate: Joi.date()
                  .iso()
                  .required()
                  .allow(null)
                  .description(
                    'The result Treatment status date in iso format'
                  ),
                resultTreatmentId: Joi.string()
                  .required()
                  .allow(null)
                  .description('The result treatment status id'),
                resultTreatmentName: Joi.string()
                  .required()
                  .allow(null)
                  .description('The result treatment status name'),
                patientData: Joi.object()
                  .allow(null)
                  .description('Patient data'),
                type: Joi.string()
                  .required()
                  .description('The type of the milestone'),
                sampleType: Joi.string()
                  .required()
                  .allow('', null)
                  .description('The sample type'),
                date: Joi.date()
                  .iso()
                  .required()
                  .allow(null)
                  .description('The date of the milestone'),
                description: Joi.string()
                  .optional()
                  .allow('', null)
                  .description('description of the milestone'),
                patientDataSchema: Joi.object()
                  .required()
                  .allow(null)
                  .description('The Patient Schema'),
                followUpTypeName: Joi.string()
                  .optional()
                  .allow(null)
                  .description('The follow up type name'),
                followUpName: Joi.string()
                  .optional()
                  .allow(null)
                  .description('The follow up name'),
                resultCategory1: Joi.string()
                  .required()
                  .description('The result category 1'),
                resultCategory2: Joi.string()
                  .required()
                  .allow(null)
                  .description('The result category 2'),
                followUpCreatedOn: Joi.date()
                  .iso()
                  .optional()
                  .allow(null)
                  .description(
                    'The follow up(Treatment/outcome) creation date in iso format'
                  ),
                followUpDate: Joi.date()
                  .iso()
                  .optional()
                  .allow(null)
                  .description('follow up date'),
                resultFollowUpId: Joi.number()
                  .optional()
                  .allow(null)
                  .description('the follow up id'),
                followUpTypeExternalId: Joi.string()
                  .optional()
                  .allow(null)
                  .description('the follow up type id'),
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
              })
            )
            .required()
            .description('The patient results'),
        }),
      },
    },
  },
  {
    method: 'POST',
    path: '/result/transfer/{resultId}',
    handler: asyncHandler(transferResult),
    config: {
      description: 'Transfer result to another clinic',
      notes: 'Transfer result to a clinic from POST param',
      auth: { scope: ['result:edit', 'result:admin'] },
      validate: {
        params: {
          resultId: Joi.number()
            .required()
            .integer()
            .positive()
            .description('Result ID'),
        },
        payload: {
          siteId: Joi.number()
            .integer()
            .positive()
            .description('New Site ID to transfer current result'),
          timestamp: Joi.number()
            .integer()
            .positive()
            .description('UTC timestamp'),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool()
            .required()
            .description('False if there was some sort of error'),
          data: Joi.object()
            .required()
            .description('Return current result')
            .keys(validateResultResponse()),
        }),
      },
    },
  },
]

module.exports = { routes }
