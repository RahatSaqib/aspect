const Joi = require('@hapi/joi')
const { asyncHandler, validateSortPageParams, validateDateRangeParams } = require('../routes')
const {
  listResultsBaseConfig,
  getResultAggregationsValidate,
  clinicalIndicatorsValidGroups,
  resultAggregationsResponseItem,
  followUpAggregationsValidGroups,
  validateResultListResponse,
  validateResultDetailResponse,
  resultCreatePayload,
  treatmentTrackingValidationQuery,
  currentTestingValidGroups,
  validateResponseResultCounts,
  optionalId,
} = require('./endpointsValidation')
const { listResults, resultCount } = require('./listResults/listResults')
const {
  downloadResultsList,
  showResult,
  listResultTypes,
  updateTreatmentStatusPost,
  listTreatmentStatusTypes,
  showDeviceLogs,
  showFileReferences,
  downloadFile,
  downloadFirstImage,
  confirmedTreatmentTracking,
  listFollowUps,
  setResultFollowUp,
  updateResultFollowUp,
  deleteResultFollowUp,
  transferResult,
  updateTransferNotification,
  followUpAggregations,
  createResult,
  listSampleTypes,
  trendInQuartersMtbDetected,
  trendInQuartersRifDetected,
  xdrAssayGraphAggregations,
  currentResultAggregations,
} = require('./service')
const { getPatientResultsDetails } = require('./patientResultDetailService')
const { exportResults } = require('./serviceReport')
const { updateResult } = require('./updateResult')
const { getResultsOverview } = require('./dashboard/getResultsOverview')
const { xdrDevicesSummaryList } = require('./xdrDevicesSummaryList')
const { listGx10CTrendsNational, listGx10CTrendsProvincial } = require('./serviceReport/trendReports')
const { validateAllGeographyFilterParams } = require('../geography/requestValidation')
const { getTbTestingDiagnosisTrend } = require('./dashboard/getTbTestingDiagnosisTrend')
const { clinicalIndicatorAggregations } = require('./common/logic')

const configs = {
  trendInQuarters: {
    auth: { scope: ['site', 'result'] },
    validate: {
      query: {
        ...getResultAggregationsValidate(clinicalIndicatorsValidGroups),
      },
    },
    response: {
      options: {
        allowUnknown: false,
      },
      schema: Joi.object().keys({
        grouped: Joi.array().required().description('List of prepared data for the graph'),
        keysFromGrouped: Joi.array().required().description('List of keys for series'),
        i18nKeys: Joi.object().required().description('Intl keys for axis X'),
      }),
    },
  },
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
      response: {
        options: {
          allowUnknown: true,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          length: Joi.number().required().description('The number of results included in this response'),
          extraColumns: Joi.array()
            .allow(null)
            .optional()
            .description('Extra columns arrays')
            .items(Joi.object().optional()),
          data: Joi.array()
            .required()
            .description('The results')
            .items(Joi.object().keys(validateResultListResponse())),
          hasNextPage: Joi.bool()
            .required()
            .description('True if there are more results available beyond the current page'),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/result-count',
    handler: asyncHandler(resultCount),
    config: {
      description: 'Result Count',
      notes: 'Returns the total count of results that match the given filters',
      ...listResultsBaseConfig(),
      response: {
        options: {
          allowUnknown: true,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          total: Joi.number().required().description('The total number of results that match the given filters'),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/result/{resultId}',
    handler: asyncHandler(showResult),
    config: {
      description: 'Result Detail',
      notes: 'Details of a result',
      auth: { scope: ['result:view'] },
      validate: {
        params: {
          resultId: Joi.string().description('Result ID').required(),
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
      auth: { scope: ['result:view'] },
      validate: {
        params: {
          resultId: Joi.string().description('Result ID').required(),
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
      auth: { scope: ['result:view'] },
      validate: {
        params: {
          resultId: Joi.string().description('Result ID').required(),
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
      auth: { scope: ['result:view'] },
      validate: {
        params: {
          resultId: Joi.string().description('File Reference ID').required(),
          fileReferenceId: Joi.string().description('File Reference ID').required(),
          fileName: Joi.string().description('FileName').required(),
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
      auth: { scope: ['result:view'] },
      validate: {
        params: {
          resultId: Joi.string().description('File Reference ID').required(),
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
      auth: { scope: ['result'] },
      validate: {
        query: {
          name: Joi.string().allow('').description('Filter for result type name'),
          ...validateSortPageParams('name'),
        },
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
          resultId: Joi.number().integer().positive().description('Result Id'),
        },
        payload: {
          firstViewedOn: Joi.date().required().description('first viewed date'),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.object().required().description('Return current result').keys(validateResultDetailResponse()),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/result/export',
    handler: exportResults,
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
      auth: { scope: ['result:view'] },
      validate: {
        query: {
          minUpdatedOn: Joi.date().iso().allow(null).description('Updated From Date'),
          diseaseExternalIds: Joi.string().allow(null).optional().description('A csv of the diseases external ID'),
          maxUpdatedOn: Joi.date().iso().allow(null).description('Updated To Date'),
          patientSample: Joi.string()
            .optional()
            .description(
              'Is the string for look for the patient. this string could be the patient id, the sample id or the patient name'
            ),
          assayExternalIds: Joi.string().optional().description('a csv string with the assay externalId'),
          resultCategories: Joi.string().optional().description('an array with the assay type abbreviation'),
          treatmentStatus: Joi.string().optional().description('External Id of the treatment status'),
          deviceType: Joi.string()
            .optional()
            .description('External Id Device type, the default value is CepheidGeneXpert'),
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
          ok: Joi.bool().required().description('False if there was some sort of error'),
          total: Joi.number().required().description('The total number of results that match the given filters'),
          length: Joi.number().required().description('The number of results included in this response'),
          data: Joi.array()
            .required()
            .description('The results')
            .items(
              Joi.object().keys({
                id: Joi.number().required().description('Unique ID of the result for this instance of Aspect'),
                externalId: Joi.string().required().description('Unique ID of the result for this diagnostic device'),
                endedOn: Joi.date()
                  .required()
                  .description(
                    'When sample processing ended. Note that the zone designator is empty because this is the local date/time as reported by the device. This should be shown as is and not converted to the user time zone.'
                  ),
                updatedOn: Joi.date()
                  .required()
                  .description(
                    'When the result was last updated in the Aspect database. This can be converted to the user time zone.'
                  ),
                assayExternalId: Joi.string().required().description('Unique ID of the Assay'),
                diseaseName: Joi.string().allow('', null).description('Disease name'),
                diseaseExternalId: Joi.string().allow('', null).required().description('Unique ID of the disease'),
                siteName: Joi.string()
                  .required()
                  .description('Name of the site where the device was located when the sample was processed'),
                deviceName: Joi.string().required().description('Name of the device'),
                resultCategory1ExternalId: Joi.string().allow(null).description('Category of the first result'),
                resultCategory2ExternalId: Joi.string().allow(null).description('Category of the second result'),
                treatmentStatus: Joi.object()
                  .allow(null)
                  .description('Current treatment status of the result')
                  .keys({
                    changedOn: Joi.date().description('Date of the latest change to the treatment status').allow(null),
                    externalId: Joi.string().description('External ID of the treatment status').allow(null),
                    i18nKey: Joi.string().description('i18nKey ID of the treatment status').allow(null),
                    name: Joi.string().description('Name of the treatment status').allow(null),
                  }),
                patientData: Joi.object().allow(null).description('Data about the patient'),
                resultData: Joi.object().allow(null).description('Data about the result'),
                sampleOriginSiteId: Joi.number().allow(null).description('Sample Origin Site Id for the patient'),
                firstViewedOn: Joi.date().allow(null).description('date when result first viewed'),
                sample: Joi.object()
                  .description('The sample that the result is based on')
                  .keys({
                    id: Joi.string().allow(null).description('ID of the sample'),
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
                      id: Joi.number().required().description('Result follow up ID'),
                      externalId: Joi.string().allow(null, '').description('External ID of the follow up'),
                      date: Joi.date().allow(null).description('When the follow up started'),
                      createdOn: Joi.date().required().description('When the follow up was first created in Aspect'),
                      updatedOn: Joi.date().required().description('When the follow up was last updated in Aspect'),
                      followUpExternalId: Joi.string().required().description('External ID of the follow up'),
                      followUpName: Joi.string().required().description('Name of the follow up'),
                      followUpi18nKey: Joi.string().required().description('Translation key for the follow up'),
                      followUpTypeName: Joi.string().required().description('Name of the follow up type'),
                      followUpTypeExternalId: Joi.string().required().description('External ID of the follow up type'),
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
                      id: Joi.number().required().description('Result comment ID'),
                      text: Joi.string().allow(null, '').description('Comment text'),
                      createdOn: Joi.date().required().description('When comment was first created'),
                      createdBy: Joi.string().allow(null, '').description('Who added comment'),
                      changedOn: Joi.date().required().description('When the comment was last updated'),
                      changedBy: Joi.string().allow(null, '').description('Who changed comment'),
                      noteType: Joi.string().allow(null, '').description('Type of comment'),
                    })
                  ),
                // transfer result
                reportableSiteName: Joi.string()
                  .allow('', null)
                  .description('The name of reportable site, differ from siteName when transferred'),
                transferredOn: Joi.date().allow(null).description('When result was transferred to another clinic'),
                transferredBy: Joi.string().allow(null).description('Who transferred result to another clinic'),
                resultStatusLogId: Joi.number()
                  .allow(null)
                  .integer()
                  .positive()
                  .description('The id of last entry in ResultStatusLog for current result'),
                reportableSiteId: Joi.number().allow(null).description('Reportable siteId of the patient'),
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
      auth: { scope: ['result:view'] },
    },
  },
  {
    method: 'PUT',
    path: '/result/treatment-status/{resultId}',
    handler: asyncHandler(updateTreatmentStatusPost),
    config: {
      description: 'Update Result Treatment Status',
      notes: 'Update the treatment status of a result',
      auth: { scope: ['treatmentStatus:edit'] },
      validate: {
        params: {
          resultId: Joi.number().integer().positive().description('Result Id'),
        },
        payload: {
          resultTreatmentStatusId: Joi.number().integer().positive().allow(null),
          externalId: Joi.string().allow('', null),
          data: Joi.string().allow('', null),
          method: Joi.string().allow('', null),
          changedOn: Joi.date()
            .iso()
            .optional()
            .description('This is the date when the status were updated. This is optional'),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.object().required().description('The results').keys(validateResultDetailResponse()),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/result/confirmed-treatment-tracking',
    handler: asyncHandler(confirmedTreatmentTracking),
    config: {
      description: 'Aggregated data for Treatment Graph on dashboard',
      notes: 'Set of percentages of Confirmed and Unaccountable percentage for few months',
      auth: {
        scope: ['treatmentStatus:view', 'result:view'],
      },
      validate: {
        ...treatmentTrackingValidationQuery(),
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
      auth: { scope: ['treatmentStatus:view'] },
      validate: {
        query: {
          typeId: Joi.number().integer().allow(null).description('ID of the follow up type'),
          assayId: Joi.number().integer().allow(null).description('ID of the assay'),
          diseaseId: Joi.number().integer().positive().optional().description('The disease ID'),
          resultCategory1: Joi.number().integer().allow(null).description('ID of the first result category'),
          resultCategory2: Joi.number().integer().allow(null).description('ID of the second result category'),
        },
      },
      response: {
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          total: Joi.number().required().description('The total number of follow-ups that match the given filters'),
          length: Joi.number().required().description('The number of follow-ups included in this response'),
          data: Joi.array()
            .required()
            .description('The possible result follow-ups')
            .items(
              Joi.object().keys({
                id: Joi.number().required().description('Unique ID of the follow up for this instance of Aspect'),
                name: Joi.string().required().description('Name of the follow up'),
                externalId: Joi.string().required().description('Unique ID of the follow up'),
                i18nKey: Joi.string().required().description('Translation key'),
                type: Joi.object()
                  .description('Type of follow up')
                  .keys({
                    id: Joi.number()
                      .required()
                      .description('Unique ID of the follow up type for this instance of Aspect'),
                    name: Joi.string().required().description('Name of the follow up type'),
                    externalId: Joi.string().required().description('Unique ID of the follow up type'),
                    i18nKey: Joi.string().required().description('Translation key'),
                  }),
                assays: Joi.array().items(
                  Joi.object().keys({
                    id: Joi.number().required().description('Unique ID of the assay for this instance of Aspect'),
                    name: Joi.string().required().description('Name of the assay'),
                    externalId: Joi.string().required().description('Unique ID of the assay'),
                    i18nKey: Joi.string().required().description('Translation key'),
                    resultCategories: Joi.array().items(
                      Joi.object().keys({
                        category1: Joi.object().keys({
                          id: Joi.any().required().description('Unique ID of the result category'),
                          name: Joi.string().required().description('Name of the assay'),
                          externalId: Joi.string().required().description('Unique ID of the assay'),
                          i18nKey: Joi.string().required().description('Translation key'),
                        }),
                        category2: Joi.object().keys({
                          id: Joi.number().required().description('Unique ID of the result category'),
                          name: Joi.string().required().description('Name of the assay'),
                          externalId: Joi.string().required().description('Unique ID of the assay'),
                          i18nKey: Joi.string().required().description('Translation key'),
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
      auth: { scope: ['treatmentStatus:edit'] },
      validate: {
        params: {
          resultId: Joi.number().required().integer().positive().description('Result ID'),
        },
        payload: Joi.object()
          .keys({
            externalId: Joi.string()
              .allow('', null)
              .description(
                'Optional externalId of the result follow up. This is mostly for app-use so apps can uniquely identify a follow up record that they created.'
              ),
            followUpId: Joi.number().integer().positive().allow(null).description('The ID of the follow up'),
            followUpExternalId: Joi.string()
              .allow('', null)
              .description('The externalId of the follow up. Will be used if followUpId is null/empty.'),
            date: Joi.date().iso().optional().allow(null).description('This is the date when the follow up happened'),
          })
          .xor('followUpId', 'followUpExternalId'),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.object().required().description('The results').keys(validateResultDetailResponse()),
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
      auth: { scope: ['treatmentStatus:edit'] },
      validate: {
        params: {
          resultId: Joi.number().required().integer().positive().description('Result ID'),
        },
        payload: Joi.object()
          .keys({
            id: Joi.number().integer().positive().allow(null).description('The ID of the result follow up.'),
            externalId: Joi.string()
              .allow('', null)
              .description(
                'The externalId of the result follow up. Will be used in combination with the result ID to find the result follow up if id is empty'
              ),
            date: Joi.date().iso().optional().allow(null).description('This is the date when the follow up happened'),
            followUpId: Joi.number().integer().positive().allow(null).description('The ID of the follow up'),
            followUpExternalId: Joi.string()
              .allow('', null)
              .description('The externalId of the follow up. Will be used if followUpId is null/empty.'),
          })
          .xor('id', 'externalId'),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.object().required().description('The results').keys(validateResultDetailResponse()),
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
      auth: { scope: ['treatmentStatus:edit'] },
      validate: {
        params: {
          resultId: Joi.number().required().integer().positive().description('Result ID'),
        },
        payload: Joi.object()
          .keys({
            id: Joi.number().integer().positive().allow(null).description('The ID of the result follow up.'),
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
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.object().required().description('The results').keys(validateResultDetailResponse()),
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
      auth: { scope: ['patient:view'] },
      validate: {
        query: {
          patientId: Joi.string().required().description('patient Id'),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.array()
            .items(
              Joi.object().keys({
                resultId: Joi.number().required().description('The id of the result'),
                sampleCollectedOn: Joi.date()
                  .iso()
                  .required()
                  .description('The date when the sample was taken in iso format'),
                originalSiteName: Joi.string()
                  .required()
                  .description('The name of the place where the sample was taken'),
                sampleId: Joi.string().required().description('The sample id'),
                resultEndedOn: Joi.date().iso().required().description('The result ended date in iso format'),
                assayAbbreviation: Joi.string().required().description('The assay abbreviation name'),
                assayId: Joi.string().required().description('The assay id'),
                diseaseId: Joi.number().integer().positive().optional().description('The disease ID'),
                resultData: Joi.object().required().description('The result data'),
                resultSiteName: Joi.string().required().description('The result site name'),
                resultNotes: Joi.string().required().allow(null).description('The result notes'),
                resultTreatmentStatusLogDate: Joi.date()
                  .iso()
                  .required()
                  .allow(null)
                  .description('The result Treatment status date in iso format'),
                resultTreatmentId: Joi.string().required().allow(null).description('The result treatment status id'),
                resultTreatmentName: Joi.string()
                  .required()
                  .allow(null)
                  .description('The result treatment status name'),
                patientData: Joi.object().allow(null).description('Patient data'),
                type: Joi.string().required().description('The type of the milestone'),
                sampleType: Joi.string().required().allow('', null).description('The sample type'),
                date: Joi.date().iso().required().allow(null).description('The date of the milestone'),
                description: Joi.string().optional().allow('', null).description('description of the milestone'),
                patientDataSchema: Joi.object().required().allow(null).description('The Patient Schema'),
                followUpTypeName: Joi.string().optional().allow(null).description('The follow up type name'),
                followUpName: Joi.string().optional().allow(null).description('The follow up name'),
                resultCategory1: Joi.string().required().description('The result category 1'),
                resultCategory2: Joi.string().required().allow(null).description('The result category 2'),
                followUpCreatedOn: Joi.date()
                  .iso()
                  .optional()
                  .allow(null)
                  .description('The follow up(Treatment/outcome) creation date in iso format'),
                followUpDate: Joi.date().iso().optional().allow(null).description('follow up date'),
                resultFollowUpId: Joi.number().optional().allow(null).description('the follow up id'),
                followUpTypeExternalId: Joi.string().optional().allow(null).description('the follow up type id'),
                // transfer result
                reportableSiteName: Joi.string()
                  .allow('', null)
                  .description('The name of reportable site, differ from siteName when transferred'),
                transferredOn: Joi.date().allow(null).description('When result was transferred to another clinic'),
                transferredBy: Joi.string().allow(null).description('Who transferred result to another clinic'),
                resultStatusLogId: Joi.number()
                  .allow(null)
                  .integer()
                  .positive()
                  .description('The id of last entry in ResultStatusLog for current result'),
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
      auth: { scope: ['result:edit'] },
      validate: {
        params: {
          resultId: Joi.number().required().integer().positive().description('Result ID'),
        },
        payload: {
          siteId: Joi.number().integer().positive().description('New Site ID to transfer current result'),
          timestamp: Joi.number().integer().positive().description('UTC timestamp'),
          comment: Joi.string().allow(null, '').description('Comment about this transfer'),
          includeAllResults: Joi.boolean()
            .optional()
            .allow(null)
            .description('Include all results related to Patient ID'),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.object().required().description('Return current result').keys(validateResultDetailResponse()),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/result/clinical-indicator-aggregations',
    handler: asyncHandler(clinicalIndicatorAggregations),
    config: {
      description: 'Clinical Indicators Dashboard',
      notes: 'Data for most of the graphs on the clinical indicators page',
      auth: { scope: ['site', 'result'] },
      validate: {
        query: {
          ...getResultAggregationsValidate(clinicalIndicatorsValidGroups),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          data: Joi.array()
            .required()
            .description('List of counts of grouped/filtered results')
            .items(
              Joi.object().keys({
                ...resultAggregationsResponseItem,
              })
            ),
          totalResults: Joi.number().allow(null).integer().positive().description('Number of affected/used results'),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/result/trend-in-quarters-mtb-detected',
    handler: asyncHandler(trendInQuartersMtbDetected),
    config: {
      description: 'Data for graph Mtb Detected Trend in Quarters',
      notes: 'Feed graph directly',
      ...configs.trendInQuarters,
    },
  },
  {
    method: 'GET',
    path: '/result/trend-in-quarters-rif-detected',
    handler: asyncHandler(trendInQuartersRifDetected),
    config: {
      description: 'Data for graph Rif Detected Trend in Quarters',
      notes: 'Feed graph directly',
      ...configs.trendInQuarters,
    },
  },
  {
    method: 'GET',
    path: '/result/follow-up-aggregations',
    handler: asyncHandler(followUpAggregations),
    config: {
      description: 'Follow-up aggregations for report',
      notes: 'Data for graphs showing different follow-up aggregations',
      auth: { scope: ['site', 'result'] },
      validate: {
        query: {
          ...getResultAggregationsValidate(followUpAggregationsValidGroups),
          followUpType: Joi.string().required().description('Filter by result followUpType (FollowUpType.externalId)'),
          followUp: Joi.string().allow('', null).description('Filter by result followUp (FollowUp.externalId)'),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          data: Joi.array()
            .required()
            .description('List of reports')
            .items(
              Joi.object().keys({
                ...resultAggregationsResponseItem,
                followUp: Joi.string().allow(null).description('The followUp that the count is grouped by'),
                followUpI18nKey: Joi.string().allow('', null).description('Follow up 18n key'),
                resultCategory1I18nKey: Joi.string().allow('', null).description('Result Category 1 18n key'),
              })
            ),
        }),
      },
    },
  },
  {
    method: 'POST',
    path: '/result',
    handler: asyncHandler(createResult),
    config: {
      description: 'Create New Result',
      notes: 'Details of a result',
      auth: { scope: ['result:edit'] },
      validate: {
        payload: resultCreatePayload,
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.object().required().description('The result that was created').keys(validateResultDetailResponse()),
        }),
      },
    },
  },
  {
    method: 'PUT',
    path: '/result/{resultId}',
    handler: asyncHandler(updateResult),
    config: {
      description: 'Update Result Details',
      notes: 'Details of a result',
      auth: { scope: ['result:edit'] },
      validate: {
        params: {
          resultId: Joi.number().description('Result ID').required(),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.object().required().description('The result that was updated'),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/result/sample-types',
    handler: asyncHandler(listSampleTypes),
    config: {
      description: 'Sample types',
      notes: 'List of all sample types',
      auth: { scope: ['result'] },
    },
  },
  {
    method: 'GET',
    path: '/result/xdr-assay-graph',
    handler: asyncHandler(xdrAssayGraphAggregations),
    config: {
      description: 'XDR Assay graph on Dashboard',
      notes: 'Returns data for 3 grouped bars and percentage line',
      auth: { scope: ['site', 'result'] },
      validate: {
        query: {
          ...getResultAggregationsValidate(clinicalIndicatorsValidGroups),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          grouped: Joi.array().required().description('List of prepared data for the graph'),
          keysFromGrouped: Joi.array().required().description('List of keys for series'),
          i18nKeys: Joi.object().required().description('Intl keys for axis X'),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/result/current-result-aggregations',
    handler: asyncHandler(currentResultAggregations),
    config: {
      description: 'Current Testing Dashboard',
      notes: 'Data for most of the graphs on the Current Testing page',
      auth: { scope: ['site', 'result'] },
      validate: {
        query: {
          ...getResultAggregationsValidate(currentTestingValidGroups),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          data: Joi.array()
            .required()
            .description('List of counts of grouped/filtered results')
            .items(
              Joi.object().keys({
                ...resultAggregationsResponseItem,
                lga: Joi.string().optional().allow(null, '').description('The LGA that the count is grouped by'),
              })
            ),
          totalResults: Joi.number().allow(null).integer().positive().description('Number of affected/used results'),
          totalResultsInPeriod: Joi.number().allow(null).integer().description('Total results in specified date range'),
          totalResultsCurrentYear: Joi.number().allow(null).integer().description('Total results this year'),
          averageTestsPerMonthCurrentYear: Joi.number().allow(null).description('Average tests per month this year'),
          totalResultsToday: Joi.number().allow(null).integer().description('Total results for today'),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/result/overview',
    handler: asyncHandler(getResultsOverview),
    config: {
      description: 'Count of all results',
      notes: 'Count of all results',
      auth: { scope: ['dashboard', 'result'] },
    },
  },
  {
    method: 'GET',
    path: '/result/xdr-summary-screen',
    handler: asyncHandler(xdrDevicesSummaryList),
    config: {
      description: 'XDR Assay Results Summary Screen',
      notes: 'XDR Assay Results Summary Screen',
      auth: { scope: ['site', 'result'] },
      validate: {
        query: {
          ...validateAllGeographyFilterParams(),
          ...validateDateRangeParams(),
          ...validateSortPageParams('locationName', 'cntAll'),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False on any non-fatal error'),
          total: Joi.number().required().description('The total number of items'),
          length: Joi.number().required().description('The number of items included in this response'),
          data: Joi.array()
            .allow(null)
            .items(
              Joi.object().keys({
                locationName: Joi.string().description('The location name (Site / LGA / State)'),
                isPmdt: Joi.number().description('Number of PMDT Sites with 10 C GX'),
                hasPerformedXdr: Joi.number().description('Number of sites tested MTB/XDR Assay'),
                ...validateResponseResultCounts(),
              })
            ),
        }),
      },
    },
  },

  {
    method: 'GET',
    path: '/result/gx-10c-trends-national',
    handler: asyncHandler(listGx10CTrendsNational),
    config: {
      description: 'National GX-10C Trends',
      notes: 'Returns the number of results per month, for the last 5 years + current year for all regions',
      auth: { scope: ['site', 'result'] },
      validate: {
        query: {
          ...getResultAggregationsValidate([]),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.array()
            .allow(null)
            .items(
              Joi.object().keys({
                ...resultAggregationsResponseItem,
              })
            ),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/result/gx-10c-trends-provincial',
    handler: asyncHandler(listGx10CTrendsProvincial),
    config: {
      description: 'Provincial GX-10C Trends',
      notes: 'Returns the number of results per state and month, for the last 5 years + current year for all regions',
      auth: { scope: ['site', 'result'] },
      validate: {
        query: {
          ...getResultAggregationsValidate([]),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.array()
            .allow(null)
            .items(
              Joi.object().keys({
                locationName: Joi.string().description('The location name (Site / LGA / State)'),
                stateId: optionalId('The id of the State'),
                currYearTotals: Joi.object().keys({
                  ...validateResponseResultCounts(),
                }),
                currYearMeanPerMonth: Joi.object().keys({
                  ...validateResponseResultCounts(),
                }),
                prevYearMeanPerMonth: Joi.object().keys({
                  ...validateResponseResultCounts(),
                }),
                today: Joi.object().keys({
                  ...validateResponseResultCounts(),
                }),
                trends: Joi.array()
                  .allow(null)
                  .items(
                    Joi.object().keys({
                      year: Joi.number().allow(null).description('Year'),
                      ...validateResponseResultCounts(),
                    })
                  ),
              })
            ),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/result/tb-testing-diagnosis-trend',
    handler: asyncHandler(getTbTestingDiagnosisTrend),
    config: {
      description: 'TB Testing Diagnosis Trend Screen',
      notes: 'TB Testing Diagnosis Trend Screen for PK Dashboard',
      auth: { scope: ['dashboard', 'result'] },
      validate: {
        query: {
          ...getResultAggregationsValidate(clinicalIndicatorsValidGroups),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          grouped: Joi.array().required().description('List of prepared data for the graph'),
          keysFromGrouped: Joi.array().required().description('List of keys for series'),
          i18nKeys: Joi.object().required().description('Intl keys for axis X'),
        }),
      },
    },
  },
]

module.exports = { routes }
