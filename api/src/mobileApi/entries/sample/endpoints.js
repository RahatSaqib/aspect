const { sampleRegistrationPayloadValidation, sampleRegistrationResponseValidation } = require('./common/validations')
const { registerNewSample } = require('./service')
const { asyncHandler } = require('../../../routes')

// -----------------------------------------------------
// routes
// -----------------------------------------------------
const routes = [
  {
    method: 'POST',
    path: '/v4/sample/register',
    handler: asyncHandler(registerNewSample),
    config: {
      description: 'Register new sample specimen',
      notes: 'Ability to register a new sample specimen by hand using Aspect Mobile',
      auth: { scope: ['result:edit'] },
      validate: {
        payload: sampleRegistrationPayloadValidation(),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: sampleRegistrationResponseValidation,
      },
    },
  },
]

module.exports = { routes }
