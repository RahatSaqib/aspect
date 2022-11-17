const { downloadResultsList } = require('./download')
const { downloadResultsListV2 } = require('./downloadV2')
const { downloadResultById } = require('./downloadById')
const { downloadResultByIdV2 } = require('./downloadByIdV2')
const { updateResultFollowUp } = require('./resultFollowup')
const {
  downloadResultValidation,
  downloadResultResponseValidation,
  downloadResultValidationV2,
  downloadResultResponseValidationV2,
  undateResultFollowupParamValidation,
  updateResultFollowupPayloadValiation,
  undateResultFollowupResponseValidation,
} = require('./common/validations')

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
]

module.exports = { routes }
