const Joi = require('@hapi/joi')
const { asyncHandler, validateDateRangeParams, validateSortPageParams } = require('../routes')
const { validateAllGeographyFilterParams } = require('../geography/requestValidation')

const { exportContacts } = require('./serviceReports')
const { contactDetailsPayload, newContactDetailsPayload, personDetailsResponse } = require('./helpers')
const { listPeopleForSelectList } = require('./listPeopleForSelectList')
const { listPeople } = require('./listPeople')
const { updatePersonStatus } = require('./updatePersonStatus')
const { updateRefreshToken } = require('./updateRefreshToken')
const { listRefreshTokens } = require('./listRefreshTokens')
const { availableContacts } = require('./availableContacts')
const { assignContact } = require('./assignContact')
const { unAssignContact } = require('./unAssignContact')
const { updatePerson } = require('./updatePerson')
const { updatePersonUserPreferences } = require('./updatePersonUserPreferences')
const { createPerson } = require('./createPerson')
const { showPerson } = require('./showPerson')
const { recordPageView } = require('./recordPageView')
const { hasPermission } = require('./hasPermission')

function listContactBaseConfig() {
  return {
    auth: { scope: ['person:view'] },
    validate: {
      query: {
        contactNameOrEmail: Joi.string().allow('').description('Filter for person name/email'),
        siteId: Joi.number().allow('').description('Site ID'),
        format: Joi.string().allow('').description('File format for exporting data'),
        geographicLevel: Joi.string().valid('', 'lab', 'state', 'lga').description('The geographic scope level'),
        tags: Joi.array().items(Joi.string()).single().description('The tags assigned to persons'),
        tagDetails: Joi.array()
          .items(Joi.object())
          .single()
          .description('The array of {tagName,tagId} assigned to persons'),
        contactStatus: Joi.number().allow('').description('Filter for person enabled/disabled'),
        ...validateAllGeographyFilterParams(),
        ...validateSortPageParams('name', 'assignments', 'state', 'lga', 'email', 'cell', 'phone', 'lastLogin'),
      },
    },
  }
}

function listReporterBaseConfig() {
  return {
    auth: { scope: ['reporter:view'] },
    validate: {
      query: {
        contactNameOrEmail: Joi.string().allow('').description('Filter for person name/email'),
        deviceName: Joi.string().allow('').description('Filter for device name'),
        assayId: Joi.string().allow('').description('Filter for assay'),
        diseaseId: Joi.number().integer().positive().optional().description('The disease ID'),
        treatmentStatusId: Joi.string().allow('').description('Filter for treatment status'),
        format: Joi.string().allow('').description('File format for exporting data'),
        contactStatus: Joi.number().allow('').description('Filter for person enabled/disabled'),
        revoked: Joi.string().valid('0', '1').description('Filter for revoked status'),
        ...validateAllGeographyFilterParams(),
        ...validateDateRangeParams(),
        ...validateSortPageParams(
          'user',
          'deviceName',
          'createdOn',
          'lastSeen',
          'delivered',
          'acknowledgedRatio',
          'confirmFollowUpRatio',
          'totalOnTreatment',
          'revoked',
          'requiresFollowUp'
        ),
      },
    },
  }
}
const routes = [
  {
    method: 'GET',
    path: '/person',
    handler: asyncHandler(listPeople),
    config: {
      description: 'People List',
      notes: 'Pageable and sortable list of people',
      ...listContactBaseConfig(),
    },
  },
  {
    method: 'GET',
    path: '/person/select-list',
    handler: asyncHandler(listPeopleForSelectList),
    config: {
      description: 'Persons for Select List',
      notes: 'List of ALL persons',
      ...listContactBaseConfig(),
    },
  },
  {
    method: 'GET',
    path: '/person/export',
    handler: exportContacts,
    config: {
      description: 'Export Contact List into Excel or CSV',
      notes: 'Filtered and sorted list of Contacts',
      ...listContactBaseConfig(),
    },
  },
  {
    method: 'GET',
    path: '/person/available',
    handler: asyncHandler(availableContacts),
    config: {
      description: 'Available People List',
      notes: 'List of available users that logged in user can assign to a site',
      auth: { scope: ['site:view'] },
    },
  },
  {
    method: 'GET',
    path: '/person/refresh-token',
    handler: asyncHandler(listRefreshTokens),
    config: {
      description: 'List of all reporter app refresh tokens',
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          total: Joi.number().required().description('The total number of refresh tokens that match the given filters'),
          length: Joi.number().required().description('The number of refresh tokens included in this response'),
          data: Joi.array()
            .required()
            .description('Reporters')
            .items(
              Joi.object().keys({
                id: Joi.string().required().description('The Client ID of the refresh token'),
                user: Joi.string().required().description('The username of the person logged into the reporter app'),
                deviceName: Joi.string().required().description('The name of the mobile device used'),
                createdOn: Joi.date()
                  .required()
                  .description('The data a refresh token was created for the particular device'),
                revoked: Joi.number()
                  .valid(0, 1)
                  .required()
                  .description('Indicator of whether or not a token has been revoked'),
                lastSeen: Joi.date().required().allow(null).description('The date when the device was last online'),
                acknowledgedRatio: Joi.number().required().allow(null).description('The acknowledged ratio'),
                confirmFollowUpRatio: Joi.number().required().allow(null).description('The confirm follow up ratio'),
                delivered: Joi.number().required().description('The total result delivered'),
                requiresFollowUp: Joi.number().required().description('The total requires followup'),
                totalOnTreatment: Joi.number().required().description('The total result on treatment'),
              })
            ),
        }),
      },
      ...listReporterBaseConfig(),
    },
  },
  {
    method: 'PUT',
    path: '/person/refresh-token/{refreshTokenId}',
    handler: asyncHandler(updateRefreshToken),
    config: {
      description: 'Update a refresh token',
      auth: { scope: ['reporter:edit'] },
      validate: {
        params: {
          refreshTokenId: Joi.string().description('Refresh token id').required(),
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
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.object()
            .description('The refresh token that has been updated')
            .keys({
              id: Joi.string().required().description('The Client ID of the refresh token'),
              revoked: Joi.boolean()
                .valid(true, false)
                .required()
                .description('Indicator of whether or not a token has been revoked'),
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
      auth: { scope: ['site:view'] },
      validate: {
        params: {
          siteId: Joi.string().description('Site ID').required(),
        },
        payload: {
          id: Joi.number().integer().positive().required(),
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
      auth: { scope: ['site:view'] },
      validate: {
        params: {
          siteId: Joi.string().description('Site ID').required(),
        },
        payload: {
          id: Joi.number().integer().positive().required(),
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
      auth: { scope: ['person:view'] },
      validate: {
        params: {
          personId: Joi.string().description('Person ID').required(),
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
      auth: { scope: ['person:edit'] },
      validate: {
        params: {
          personId: Joi.string().description('Person ID').required(),
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
      auth: { scope: ['person:edit'] },
      validate: {
        payload: newContactDetailsPayload,
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
      auth: { scope: ['person:edit'] },
      validate: {
        params: {
          personId: Joi.string().description('Person ID').required(),
        },
        payload: {
          timezone: Joi.string().max(255).allow('', null),
          culture: Joi.string().max(45).allow('', null),
        },
      },
    },
  },
  {
    method: 'DELETE',
    path: '/person/{personId}',
    handler: asyncHandler(updatePersonStatus),
    config: {
      description: 'Soft Delete Person',
      notes: 'Id of a person to disable',
      auth: { scope: ['person:edit'] },
      validate: {
        params: {
          personId: Joi.string().description('Person ID').required(),
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/person/enable/{personId}',
    handler: asyncHandler(updatePersonStatus),
    config: {
      description: 'Enable Person',
      notes: 'Id of a person to enable',
      auth: { scope: ['person:edit'] },
      validate: {
        params: {
          personId: Joi.string().description('Person ID').required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/person/record-page-view',
    handler: asyncHandler(recordPageView),
    config: {
      auth: { scope: ['browse'] },
      description: 'RecordPage View',
      notes: 'Increase count of viewed pages for user',
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.boolean().required(),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/person/has-permission',
    handler: asyncHandler(hasPermission),
    config: {
      auth: { scope: ['person:view'] },
      description: 'Check user permission',
      notes: 'Check if user has country level permission',
      validate: {
        query: {
          permissions: Joi.alternatives().try(Joi.array(), Joi.string()).description('Permissions'),
        },
      },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.boolean().required(),
          hasPermission: Joi.boolean().required(),
        }),
      },
    },
  },
]

module.exports = { routes }
