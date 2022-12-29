const { preferencePayloadValidation, preferenceUpdateResponseValidation } = require('./common/validations')
const { updatePersonUserPreferences } = require('./preference')

// -----------------------------------------------------
// routes
// -----------------------------------------------------
const routes = [
  {
    method: 'PUT',
    path: '/v1/person/preferences',
    handler: updatePersonUserPreferences,
    config: {
      description: 'Update user preferences',
      notes: 'Update language and timezone',
      auth: { scope: ['person:edit'] },
      validate: {
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
