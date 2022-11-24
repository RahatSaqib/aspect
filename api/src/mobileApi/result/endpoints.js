const { downloadResultsList } = require('./download')
const { downloadResultsListV2 } = require('./downloadV2')
const { downloadResultById } = require('./downloadById')
const { downloadResultByIdV2 } = require('./downloadByIdV2')
const { updateResultFollowUp, resultFollowUpByResultId } = require('./resultFollowup')
const {
  downloadResultValidation,
  downloadResultResponseValidation,
  downloadResultValidationV2,
  downloadResultResponseValidationV2,
  undateResultFollowupParamValidation,
  updateResultFollowupPayloadValiation,
  undateResultFollowupResponseValidation,
  addClinicalResponseParamValidation,
  addClinicalResponsePayloadValidation,
  addClinicalResponseResultValidation,
} = require('./common/validations')
const { addclinicalResponse } = require('./clinicalResponse')

// -----------------------------------------------------
// routes
// -----------------------------------------------------
const routes = [
  {
    method: 'GET',
    path: '/v1/results',
    handler: downloadResultsList,
    config: {
      description: 'Result Sync',
      notes:
        'Pageable and sortable list of complete results (including all result details). Used for syncing the reporter app',
      auth: { scope: ['result:view'] },
      validate: {
        query: downloadResultValidation(),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: downloadResultResponseValidation,
      },
    },
  },
  {
    method: 'GET',
    path: '/v2/results',
    handler: downloadResultsListV2,
    config: {
      description: 'Result Sync',
      notes:
        'Pageable and sortable list of complete results (including all result details). Used for syncing the reporter app',
      auth: { scope: ['result:view'] },
      validate: {
        query: downloadResultValidationV2(),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: downloadResultResponseValidationV2,
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/results/{resultId}',
    handler: downloadResultById,
    config: {
      description: 'Result Sync',
      notes:
        'Pageable and sortable list of complete results (including all result details). Used for syncing the reporter app',
      auth: { scope: ['result:view'] },
      validate: {
        query: downloadResultValidation(),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: downloadResultResponseValidation,
      },
    },
  },
  {
    method: 'GET',
    path: '/v2/results/{resultId}',
    handler: downloadResultByIdV2,
    config: {
      description: 'Result Sync',
      notes:
        'Pageable and sortable list of complete results (including all result details). Used for syncing the reporter app',
      auth: { scope: ['result:view'] },
      validate: {
        query: downloadResultValidationV2(),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: downloadResultResponseValidationV2,
      },
    },
  },
  {
    method: 'POST',
    path: '/v1/result/clinical-responses/{resultId}',
    handler: addclinicalResponse,
    config: {
      description: 'Add a result follow up',
      notes: 'Adds a treatment/outcome follow up for a result',
      auth: { scope: ['treatmentStatus:edit'] },
      validate: {
        params: addClinicalResponseParamValidation(),
        payload: addClinicalResponsePayloadValidation(),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: addClinicalResponseResultValidation(),
      },
    },
  },
  {
    method: 'PUT',
    path: '/v1/result/follow-up/{resultId}',
    handler: updateResultFollowUp,
    config: {
      description: 'Set the date of a follow up',
      notes: 'Updates the date of a follow up for a result',
      auth: { scope: ['treatmentStatus:edit'] },
      validate: {
        params: undateResultFollowupParamValidation(),
        payload: updateResultFollowupPayloadValiation(),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: undateResultFollowupResponseValidation(),
      },
    },
  },
  {
    method: 'GET',
    path: '/v1/result/follow-up/{resultId}',
    handler: resultFollowUpByResultId,
    config: {
      description: 'Set the date of a follow up',
      notes: 'Updates the date of a follow up for a result',
      auth: { scope: ['treatmentStatus:edit'] },
      validate: {
        params: undateResultFollowupParamValidation(),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: undateResultFollowupResponseValidation(),
      },
    },
  },
]

module.exports = { routes }
