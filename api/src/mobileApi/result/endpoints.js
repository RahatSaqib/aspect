const { asyncHandler } = require('../../routes')
const { downloadResultsList } = require('./download')
const { downloadResultsListV2 } = require('./downloadV2')
const {
  downloadResultValidation,
  downloadResultResponseValidation,
  downloadResultValidationV2,
  downloadResultResponseValidationV2,
} = require('./common/validations')

// -----------------------------------------------------
// routes
// -----------------------------------------------------
const routes = [
  {
    method: 'GET',
    path: '/v1/result/download',
    handler: asyncHandler(downloadResultsList),
    config: {
      description: 'Result Sync',
      notes:
        'Pageable and sortable list of complete results (including all result details). Used for syncing the reporter app',
      auth: { scope: ['result:view'] },
      validate: {
        query: downloadResultValidation,
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
    path: '/v2/result/download',
    handler: asyncHandler(downloadResultsListV2),
    config: {
      description: 'Result Sync',
      notes:
        'Pageable and sortable list of complete results (including all result details). Used for syncing the reporter app',
      auth: { scope: ['result:view'] },
      validate: {
        query: downloadResultValidationV2,
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: downloadResultResponseValidationV2,
      },
    },
  },
]

module.exports = { routes }
