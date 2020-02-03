const Joi = require('@hapi/joi')
const {
  validateAllGeographyFilterParams,
} = require('../geography/requestValidation')
const {
  asyncHandler,
  validateDateRangeParams,
  validateSortPageParams,
} = require('../routes')
const {
  listSites,
  showSite,
  updateSite,
  listSitesForSelectList,
} = require('./service')

const { getSitesReport } = require('./serviceReports')

function listSitesBaseConfig() {
  return {
    auth: { scope: ['site:view', 'site:edit'] },
    validate: {
      query: {
        siteIds: Joi.string()
          .allow('')
          .description('Filter for site ids'),
        deviceName: Joi.string()
          .allow('')
          .description('Filter for device name'),
        siteName: Joi.string()
          .allow('')
          .description('Filter for site name'),
        externalId: Joi.string()
          .allow('')
          .description('Filter for facility code'),
        format: Joi.string()
          .allow('')
          .description('File format for exporting data'),
        ...validateAllGeographyFilterParams(),
        ...validateDateRangeParams(),
        ...validateSortPageParams(
          'name',
          'shortName',
          'state',
          'lga',
          'createdOn',
          'totalDevices',
          'externalId'
        ),
      },
    },
  }
}
const routes = [
  {
    method: 'GET',
    path: '/site',
    handler: asyncHandler(listSites),
    config: {
      description: 'Site List',
      notes: 'Pageable and sortable list of sites',
      ...listSitesBaseConfig(),
    },
  },
  {
    method: 'GET',
    path: '/site/export',
    handler: getSitesReport,
    config: {
      description: 'Export Site List into Excel or CSV',
      notes: 'Filtered and sorted list of sites',
      ...listSitesBaseConfig(),
    },
  },
  {
    method: 'GET',
    path: '/site/{siteId}',
    handler: asyncHandler(showSite),
    config: {
      description: 'Site Detail',
      notes: 'Detail of a site',
      auth: { scope: ['site:view', 'site:edit'] },
      validate: {
        params: {
          siteId: Joi.string()
            .description('Site id')
            .required(),
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/site/{siteId}',
    handler: asyncHandler(updateSite),
    config: {
      description: 'Update Site Detail',
      notes: 'Detail of a site',
      auth: { scope: ['site:edit'] },
      validate: {
        params: {
          siteId: Joi.number()
            .integer()
            .positive()
            .description('Site id')
            .required(),
        },
        payload: {
          name: Joi.string().required(),
          shortName: Joi.string().required(),
          externalId: Joi.string().allow('', null),
          timezone: Joi.string().allow('', null),
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
          street1: Joi.string().allow('', null),
          street2: Joi.string().allow('', null),
          city: Joi.string().allow('', null),
          zip: Joi.string()
            .max(45)
            .allow('', null),
          longitude: Joi.number().allow('', null),
          latitude: Joi.number().allow('', null),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/site/select-list/{mode?}',
    handler: asyncHandler(listSitesForSelectList),
    config: {
      description: 'Sites for Select List',
      notes: "List of site ID's and names",
      auth: { scope: ['site:view', 'site:edit'] },
      validate: {
        query: {
          tags: [
            Joi.array()
              .items(Joi.string())
              .description('Tag names of sites requested')
              .optional(),
          ],
        },
      },
      response: {
        schema: Joi.object().keys({
          ok: Joi.bool()
            .required()
            .description('False if there was some sort of error'),
          countryName: Joi.string()
            .required()
            .description('Country name of the user that requested the sites'),
          stateName: Joi.string()
            .required()
            .allow(null)
            .description('State name of the user that requested the sites'),
          data: Joi.array()
            .required()
            .description('The results')
            .items(
              Joi.object().keys({
                id: Joi.number()
                  .required()
                  .description('Unique ID of the site'),
                name: Joi.string()
                  .required()
                  .description('Name of the site'),
                shortName: Joi.string()
                  .required()
                  .allow(null)
                  .description('Short name or abbreviation of the site'),
                partnerId: Joi.number()
                  .required()
                  .allow(null)
                  .description("Unique ID of the site's partner"),
                countryId: Joi.number()
                  .required()
                  .description("Unique ID of the site's country"),
                stateId: Joi.number()
                  .required()
                  .allow(null)
                  .description("Unique ID of the site's state"),
                lgaId: Joi.number()
                  .required()
                  .allow(null)
                  .description("Unique ID of the site's LGA"),
                lgaName: Joi.string()
                  .required()
                  .allow(null)
                  .description("Name of the site's LGA"),
                stateName: Joi.string()
                  .required()
                  .allow(null)
                  .description("Name of the site's state"),
                longitude: Joi.number()
                  .required()
                  .allow(null)
                  .description("Longitude of the site's coordinates"),
                latitude: Joi.number()
                  .required()
                  .allow(null)
                  .description("Latitude of the site's coordinates"),
                zip: Joi.string()
                  .required()
                  .allow(null, '')
                  .description('Zip code of the site'),
                street1: Joi.string()
                  .required()
                  .allow(null, '')
                  .description('Street where the site is allocated'),
                street2: Joi.string()
                  .required()
                  .allow(null, '')
                  .description('Street where the site is allocated'),
                city: Joi.string()
                  .required()
                  .allow(null, '')
                  .description('City where the site is allocated'),
                externalId: Joi.string()
                  .required()
                  .description('External ID of the site'),
              })
            ),
        }),
      },
    },
  },
]

module.exports = { routes }
