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
  listReporters,
  availableContacts,
  showPerson,
  updatePerson,
  updatePersonUserPreferences,
  updateReporter,
  assignContact,
  unAssignContact,
} = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/person',
    handler: asyncHandler(listPeople),
    config: {
      description: 'People List',
      notes: 'Pageable and sortable list of people',
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
          validateAllGeographyFilterParams(),
          validateSortPageParams('name', 'level', 'state', 'lga')
        ),
      },
    },
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
    path: '/person/reporter',
    handler: asyncHandler(listReporters),
    config: {
      description: 'List of all reporter apps',
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
            // Fix with real data from ResultsDownlad table tbd
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
              'The total number of reporters that match the given filters'
            ),
          length: Joi.number()
            .required()
            .description('The number of reporters included in this response'),
          data: Joi.array()
            .required()
            .description('Reporters')
            .items(
              Joi.object().keys({
                id: Joi.string()
                  .required()
                  .description('The Client ID of the reporter'),
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
    path: '/person/reporter/{reporterId}',
    handler: asyncHandler(updateReporter),
    config: {
      description: 'Update a reporter',
      auth: { scope: ['reporter:view', 'reporter:edit'] },
      validate: {
        params: {
          reporterId: Joi.string()
            .description('Reporter id')
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
            .description('The reporter that has been updated')
            .keys({
              id: Joi.string()
                .required()
                .description('The Client ID of the reporter'),
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
        payload: {
          name: Joi.string()
            .max(500)
            .required(),
          title: Joi.string()
            .max(255)
            .allow('', null),
          email: Joi.string()
            .max(500)
            .allow('', null),
          email2: Joi.string()
            .max(500)
            .allow('', null),
          phone: Joi.string()
            .max(45)
            .allow('', null),
          cell: Joi.string()
            .max(45)
            .allow('', null),
          countryId: Joi.number()
            .integer()
            .positive()
            .allow('', null),
          stateId: Joi.number()
            .integer()
            .positive()
            .allow('', null),
          lgaId: Joi.number()
            .integer()
            .positive()
            .allow('', null),
          zip: Joi.string()
            .max(45)
            .allow('', null),
          notes: Joi.string()
            .optional()
            .max(1200)
            .allow('', null),
          lastPartnerId: Joi.number()
            .integer()
            .positive()
            .allow('', null),
          canLogIn: [Joi.boolean(), Joi.number().only(0, 1)],
        },
      },
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
