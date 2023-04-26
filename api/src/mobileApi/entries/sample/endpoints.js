const {
  sampleRegistrationPayloadValidation,
  sampleRegistrationResponseValidation,
  samplesRegisteredResponseValidation,
} = require('./common/validations')
const { registerNewSample, registeredSamples } = require('./service')
const { asyncHandler } = require('../../../routes')

// -----------------------------------------------------
// routes
// -----------------------------------------------------
const routes = [
  {
    method: 'GET',
    path: '/v4/samples',
    handler: asyncHandler(registeredSamples),
    config: {
      description: 'Registered Samples',
      notes: 'All manually registered samples created by Aspect Mobile',
      // TODO create a specific scope for sample registration workflows
      auth: { scope: ['demo:view'] },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: samplesRegisteredResponseValidation,
      },
    },
  },
  {
    method: 'POST',
    path: '/v4/sample/register',
    handler: asyncHandler(registerNewSample),
    config: {
      description: 'Register new sample specimen',
      notes: 'Ability to register a new sample specimen by hand using Aspect Mobile',
      // TODO create a specific scope for sample registration workflows
      auth: { scope: ['demo:edit'] },
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
