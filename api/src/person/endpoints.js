const Joi = require('joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const {
  validateAllGeographyFilterParams,
} = require('../geography/requestValidation')
const {
  listPeople,
  availableContacts,
  showPerson,
  updatePerson,
  updatePersonUserPreferences,
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
