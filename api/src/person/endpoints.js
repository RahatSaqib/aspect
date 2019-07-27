const Joi = require('joi')
const {
  asyncHandler,
  validateDateRangeParams,
  validateSortPageParams,
} = require('../routes')
const {
  validateAllGeographyFilterParams,
} = require('../geography/requestValidation')
const {
  listPeople,
  listRefreshTokens,
  availableContacts,
  showPerson,
  updatePerson,
  createPerson,
  updatePersonUserPreferences,
  updateRefreshToken,
  assignContact,
  unAssignContact,
} = require('./service')
const { getContactReport } = require('./serviceReports')
const { contactDetailsPayload, personDetailsResponse } = require('./helpers')

function listContactBaseConfig() {
  return {
    auth: { scope: ['person:view', 'person:edit'] },
    validate: {
      query: Object.assign(
        {
          contactNameOrEmail: Joi.string()
            .allow('')
            .description('Filter for person name/email'),
        },
        {
          siteId: Joi.number()
            .allow('')
            .description('Site ID'),
        },
        {
          format: Joi.string()
            .allow('')
            .description('File format for exporting data'),
        },
        validateAllGeographyFilterParams(),
        validateSortPageParams('name', 'level', 'state', 'lga')
      ),
    },
  }
}
const routes = [
  {
    method: 'GET',
    path: '/person',
    handler: asyncHandler(listPeople),
    config: Object.assign(
      {
        description: 'People List',
        notes: 'Pageable and sortable list of people',
      },
      listContactBaseConfig()
    ),
  },
  {
    method: 'GET',
    path: '/person/export',
    handler: getContactReport,
    config: Object.assign(
      {
        description: 'Export Contact List into Excel or CSV',
        notes: 'Filtered and sorted list of Contacts',
      },
      listContactBaseConfig()
    ),
  },
  {
    method: 'GET',
    path: '/person/available',
    handler: asyncHandler(availableContacts),
    config: {
      description: 'Available People List',
      notes: 'List of available users that logged in user can assign to a site',
      auth: { scope: ['site:view', 'site:edit'] },
    },
  },
  {
    method: 'GET',
    path: '/person/refresh-token',
    handler: asyncHandler(listRefreshTokens),
    config: {
      description: 'List of all reporter app refresh tokens',
      auth: { scope: ['reporter:view', 'reporter:edit'] },
      validate: {
        query: Object.assign(
          {
            contactNameOrEmail: Joi.string()
              .allow('')
              .description('Filter for person name/email'),
            deviceName: Joi.string()
              .allow('')
              .description('Filter for device name'),
            revoked: Joi.string()
              .valid('0', '1')
              .description('Filter for revoked status'),
          },
          validateAllGeographyFilterParams(),
          validateDateRangeParams(),
          validateSortPageParams(
            'user',
            'deviceName',
            'createdOn',
            // TODO: Fix with real data from ResultsDownload table tbd
            // 'lastSeen',
            // 'lastMonth',
            // 'thisMonth',
            // 'deliveredLastMonth',
            // 'deliveredThisMonth',
            // 'acknowledgedRatio',
            // 'totalFlagged',
            'revoked'
          )
        ),
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
              'The total number of refresh tokens that match the given filters'
            ),
          length: Joi.number()
            .required()
            .description(
              'The number of refresh tokens included in this response'
            ),
          data: Joi.array()
            .required()
            .description('Reporters')
            .items(
              Joi.object().keys({
                id: Joi.string()
                  .required()
                  .description('The Client ID of the refresh token'),
                user: Joi.string()
                  .required()
                  .description(
                    'The username of the person logged into the reporter app'
                  ),
                deviceName: Joi.string()
                  .required()
                  .description('The name of the mobile device used'),
                createdOn: Joi.date()
                  .required()
                  .description(
                    'The data a refresh token was created for the particular device'
                  ),
                revoked: Joi.number()
                  .valid(0, 1)
                  .required()
                  .description(
                    'Indicator of whether or not a token has been revoked'
                  ),
                lastSeen: Joi.date()
                  .required()
                  .description('The date when the device was last online'),
                deliveredThisMonth: Joi.number()
                  .allow(null)
                  .description('Number of tests delivered in the last 30 days'),
                deliveredLastMonth: Joi.number()
                  .allow(null)
                  .description(
                    'Number of tests delivered in the 30 days before that'
                  ),
                acknowledgedRatio: Joi.number()
                  .required()
                  .description('The acknowledged ratio'),
                totalFlagged: Joi.number()
                  .required()
                  .description('The total flagged'),
              })
            ),
        }),
      },
    },
  },
  {
    method: 'PUT',
    path: '/person/refresh-token/{refreshTokenId}',
    handler: asyncHandler(updateRefreshToken),
    config: {
      description: 'Update a refresh token',
      auth: { scope: ['reporter:view', 'reporter:edit'] },
      validate: {
        params: {
          refreshTokenId: Joi.string()
            .description('Refresh token id')
            .required(),
        },
        payload: {
          revoked: Joi.bool().required(),
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
            .description('The refresh token that has been updated')
            .keys({
              id: Joi.string()
                .required()
                .description('The Client ID of the refresh token'),
              revoked: Joi.boolean()
                .valid(true, false)
                .required()
                .description(
                  'Indicator of whether or not a token has been revoked'
                ),
            }),
        }),
      },
    },
  },
  {
    method: 'PUT',
    path: '/person/assign/{siteId}',
    handler: asyncHandler(assignContact),
    config: {
      description: 'Assign person as site contact',
      auth: { scope: ['site:view', 'site:edit'] },
      validate: {
        params: {
          siteId: Joi.string()
            .description('Site ID')
            .required(),
        },
        payload: {
          id: Joi.number()
            .integer()
            .positive()
            .required(),
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/person/unassign/{siteId}',
    handler: asyncHandler(unAssignContact),
    config: {
      description: "Remove person from site's contacts",
      auth: { scope: ['site:view', 'site:edit'] },
      validate: {
        params: {
          siteId: Joi.string()
            .description('Site ID')
            .required(),
        },
        payload: {
          id: Joi.number()
            .integer()
            .positive()
            .required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/person/{personId}',
    handler: asyncHandler(showPerson),
    config: {
      description: 'Person Detail',
      notes: 'Details of a person',
      auth: { scope: ['person:view', 'person:edit', 'person:admin'] },
      validate: {
        params: {
          personId: Joi.string()
            .description('Person ID')
            .required(),
        },
      },
      response: personDetailsResponse,
    },
  },
  {
    method: 'PUT',
    path: '/person/{personId}',
    handler: asyncHandler(updatePerson),
    config: {
      description: 'Update Person Details',
      notes: 'Details of a person',
      auth: { scope: ['person:edit', 'person:admin'] },
      validate: {
        params: {
          personId: Joi.string()
            .description('Person ID')
            .required(),
        },
        payload: contactDetailsPayload,
      },
      response: personDetailsResponse,
    },
  },
  {
    method: 'POST',
    path: '/person',
    handler: asyncHandler(createPerson),
    config: {
      description: 'Create New Person',
      notes: 'Details of a person',
      auth: { scope: ['person:edit', 'person:admin'] },
      validate: {
        payload: contactDetailsPayload,
      },
      response: personDetailsResponse,
    },
  },
  {
    method: 'PUT',
    path: '/person/preferences/{personId}',
    handler: asyncHandler(updatePersonUserPreferences),
    config: {
      description: "Update Person's User Preferences",
      notes: 'Timezone and Language',
      auth: { scope: ['person:edit', 'person:admin'] },
      validate: {
        params: {
          personId: Joi.string()
            .description('Person ID')
            .required(),
        },
        payload: {
          timezone: Joi.string()
            .max(255)
            .allow('', null),
          culture: Joi.string()
            .max(45)
            .allow('', null),
        },
      },
    },
  },
]

module.exports = { routes }
