const {
  preferenceParamsValidation,
  preferencePayloadValidation,
  preferenceUpdateResponseValidation,
} = require('./common/validations')
const { updatePersonUserPreferences } = require('./preference')

// -----------------------------------------------------
// routes
// -----------------------------------------------------
const routes = [
  {
    method: 'PUT',
    path: '/v1/person/preferences/{personId}',
    handler: updatePersonUserPreferences,
    config: {
      description: 'Update user preferences',
      notes: 'Update language and timezone',
      auth: { scope: ['person:edit'] },
      validate: {
        params: preferenceParamsValidation(),
        payload: preferencePayloadValidation(),
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: preferenceUpdateResponseValidation,
      },
    },
  },
]

module.exports = { routes }
