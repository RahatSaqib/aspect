const { downloadFollowUpsResponseValidation } = require('./common/validations')
const { fetchTreatmentFollowUpsServiceHandler, fetchOutcomeFollowUpsServiceHandler } = require('./common/service')
const { asyncHandler } = require('../../routes')

// -----------------------------------------------------
// routes
// -----------------------------------------------------
const routes = [
  {
    method: 'GET',
    path: '/v4/follow-up/treatments',
    handler: asyncHandler(fetchTreatmentFollowUpsServiceHandler),
    config: {
      description: 'Endpoint for retrieving follow-ups of type treatment',
      notes: 'Used for syncing Aspect Mobile options for when a clinician needs to select a treatment follow up',
      auth: { scope: ['result:view'] },
      response: {
        options: { allowUnknown: false },
        schema: downloadFollowUpsResponseValidation(),
      },
    },
  },
  {
    method: 'GET',
    path: '/v4/follow-up/outcomes',
    handler: asyncHandler(fetchOutcomeFollowUpsServiceHandler),
    config: {
      description: 'Endpoint for retrieving follow-ups of type outcome',
      notes: 'Used for syncing Aspect Mobile options for when a clinician needs to select an outcome follow up',
      auth: { scope: ['result:view'] },
      response: {
        options: { allowUnknown: false },
        schema: downloadFollowUpsResponseValidation(),
      },
    },
  },
]

module.exports = { routes }
