const Joi = require('@hapi/joi')
const { validateAllGeographyFilterParams } = require('../geography/requestValidation')
const { asyncHandler, validateDateRangeParams, validateSortPageParams } = require('../routes')
const createSite = require('./createSite')
const { update: updateSite, updateConsumablesBatch: updateSiteConsumablesBatch } = require('./updateSite')
const {
  listSites,
  showSite,
  listSitesForSelectList,
  listSitesForTransferSelectList,
  listSitesWithReporters,
  disableSite,
} = require('./service')
const { getReportingSites } = require('./getReportingSites')
const { postSchema, updateSchema, updateConsumablesBatchSchema } = require('./common/validations')

const { exportSites, exportReporters } = require('./serviceReports')
const { reportingSitesQueryParams, reportingSitesResponse } = require('./common/validation/reportingSite')

function listSitesBaseConfig() {
  return {
    auth: { scope: ['site'] },
    validate: {
      query: {
        siteIds: Joi.string().allow('').description('Filter for site ids'),
        deviceName: Joi.string().allow('').description('Filter for device name'),
        siteName: Joi.string().allow('').description('Filter for site name'),
        siteTypeId: Joi.string().allow('').description('Filter for site type'),
        parentWarehouseId: Joi.string().allow('').description('Filter for warehouse'),
        externalId: Joi.string().allow('').description('Filter for facility code'),
        format: Joi.string().allow('').description('File format for exporting data'),
        ...validateAllGeographyFilterParams(),
        ...validateDateRangeParams(),
        ...validateSortPageParams(
          'name',
          'shortName',
          'state',
          'lga',
          'createdOn',
          'totalDevices',
          'externalId',
          'inventoryUpdatedOn',
          'siteType',
          'parentWarehouseName',
          'siteConsumableCount'
        ),
      },
    },
  }
}

function reportersBaseConfig() {
  return {
    query: {
      query: {
        ...validateAllGeographyFilterParams(), // countryId, stateId, lgaId
        ...validateDateRangeParams(), // minDate, maxDate
        ...validateSortPageParams(
          'stateName',
          'lgaName',
          'partnerId',
          'siteId',
          'siteName',
          'siteShortName',
          'totalResults',
          'delivered',
          'requiresTreatment',
          'onTreatment',
          'notPossible',
          'notOnTreatment',
          'transferred'
        ),
        deviceName: Joi.string().allow('').description('Device name'),
        deviceType: Joi.string().optional().description('Filter by device type externalId'),
        siteName: Joi.string().allow('').description('Filter by site name'),
        siteIds: Joi.string().allow('').description('Filter by site ids'),
        siteId: Joi.number().integer().positive().optional().description('Filter by site Id'),
        partnerId: Joi.number().integer().positive().optional().description('Filter by Partner Id'),
        assayId: Joi.alternatives()
          .try(Joi.array().items(Joi.number()), Joi.number())
          .allow(null, '')
          .description('Filter for assay ID(s)'),
        diseaseId: Joi.number().integer().positive().optional().description('Filter by disease Id'),
        format: Joi.string().allow('').description('File format for exporting data'),
      },
    },
    response: {
      options: {
        allowUnknown: false,
      },
      schema: Joi.object().keys({
        ok: Joi.bool().required().description('False if there was some sort of error'),
        total: Joi.number().required().description('The total number of items that match the given filters'),
        length: Joi.number().required().description('The number of items included in this response'),
        data: Joi.array()
          .required()
          .description('List of sites with statistics of reporters')
          .items(
            Joi.object().keys({
              id: Joi.number().description('ID of the site'),
              siteId: Joi.number().description('ID of the site'),
              siteName: Joi.string().description('Site name'),
              siteShortName: Joi.string().description('Site short name'),
              partnerId: Joi.number().description('Partner Id'),
              countryId: Joi.number().description('Country Id'),
              stateId: Joi.number().allow(null).description('State Id'),
              stateName: Joi.string().allow('', null).description('State name'),
              lgaId: Joi.number().allow(null).description('Lga Id'),
              lgaName: Joi.string().allow('', null).description('Lga name'),
              totalResults: Joi.number().description('The number of results where the reportable site is the clinic'),
              delivered: Joi.number().description('The number of those results that were delivered to any Reporter'),
              requiresTreatment: Joi.number().description('The number of delivered results that require treatment'),
              onTreatment: Joi.number().description('The number of delivered results on treatment'),
              notPossible: Joi.number().description(
                'The number of results where "Not Possible" was selected for treatment'
              ),
              notOnTreatment: Joi.number().description(
                `The number of results that require treatment, but that weren't put on treatment yet (not including "Not Possible" in this count)`
              ),
              transferred: Joi.number().description(
                'The number of delivered results that were transferred to another clinic'
              ),
            })
          ),
      }),
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
    handler: exportSites,
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
      auth: { scope: ['site:view'] },
      validate: {
        params: {
          siteId: Joi.string().description('Site id').required(),
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/site/{siteId}',
    handler: updateSite,
    config: {
      description: 'Update Site Detail',
      notes: 'Detail of a site',
      auth: { scope: ['site:edit'] },
      validate: updateSchema,
    },
  },

  {
    method: 'PUT',
    path: '/site/consumables/{siteId}',
    handler: updateSiteConsumablesBatch,
    config: {
      description: 'Update Site Consumables Batch',
      notes: 'Update multiple consumables for a site in a single atomic operation',
      auth: { scope: ['site', '+inventory'] },
      validate: updateConsumablesBatchSchema,
    },
  },

  {
    method: 'GET',
    path: '/site/select-list/{mode?}',
    handler: listSitesForSelectList,
    config: {
      description: 'Sites for Select List',
      notes: "List of site ID's and names",
      auth: { scope: ['site:view'] },
      validate: {
        query: {
          tags: [Joi.array().items(Joi.string()).description('Tag names of sites requested').optional()],
          siteTypeExternalIds: Joi.alternatives()
            .try(Joi.array().items(Joi.string()), Joi.string())
            .allow(null, '')
            .description('ExternalIds of site types to return')
            .optional(),
          excludeSiteIds: Joi.alternatives()
            .try(Joi.array().items(Joi.number()), Joi.number())
            .allow(null)
            .description('Site ids to exclude, i.e. current site id being edited')
            .optional(),
        },
      },
      response: {
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          mode: Joi.string().allow(null, '').description('The mode that was use for this request'),
          countryName: Joi.string().required().description('Country name of the user that requested the sites'),
          stateName: Joi.string().required().allow(null).description('State name of the user that requested the sites'),
          data: Joi.array()
            .required()
            .description('The results')
            .items(
              Joi.object().keys({
                id: Joi.number().required().description('Unique ID of the site'),
                name: Joi.string().required().description('Name of the site'),
                siteType: Joi.string().allow(null, '').description('SiteType of the site'),
                partnerId: Joi.number()
                  .when('mode', {
                    not: 'reporter',
                    then: Joi.required(),
                  })
                  .allow(null)
                  .description("Unique ID of the site's partner"),
                countryId: Joi.number()
                  .when('mode', {
                    not: 'reporter',
                    then: Joi.required(),
                  })
                  .description("Unique ID of the site's country"),
                stateId: Joi.number().allow(null).description("Unique ID of the site's state"),
                parentWarehouseId: Joi.number().allow(null).description('ID of stock provider'),
                lgaId: Joi.number()
                  .when('mode', {
                    not: 'reporter',
                    then: Joi.required(),
                  })
                  .allow(null)
                  .description("Unique ID of the site's LGA"),
                lgaName: Joi.string()
                  .when('mode', {
                    not: 'reporter',
                    then: Joi.required(),
                  })
                  .allow(null)
                  .description("Name of the site's LGA"),
                stateName: Joi.string().required().allow(null).description("Name of the site's state"),
                externalId: Joi.string()
                  .when('mode', {
                    not: 'reporter',
                    then: Joi.required(),
                  })
                  .description('External ID of the site'),
                customProperties: Joi.string().allow(null, '').description('Custom properties of the site'),
                // siteConsumables2: Joi.string().allow(null, '').description('Site consumables for the site'),
                siteConsumables: Joi.array()
                  .allow(null)
                  .items(Joi.number())
                  .description(`Site consumables (id's) for the site`),
              })
            ),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/site/transfer-select-list',
    handler: asyncHandler(listSitesForTransferSelectList),
    config: {
      description: 'States for available to transfer',
      notes: 'List of sites in the same state as the currently logged in user',
      auth: { scope: ['site:view'] },
      response: {
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          data: Joi.array()
            .required()
            .items(
              Joi.object().keys({
                id: Joi.number().required().description('Unique ID of the site'),
                name: Joi.string().required().description('Name of the site'),
              })
            ),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/site/reporters',
    handler: asyncHandler(listSitesWithReporters),
    config: {
      description: 'Sites for Reporter Dashboard',
      notes: `List of sites with some aggregations about reporters`,
      auth: { scope: ['reporter'] },
      validate: reportersBaseConfig().query,
      response: reportersBaseConfig().response,
    },
  },
  {
    method: 'GET',
    path: '/reporter/export',
    handler: exportReporters,
    config: {
      description: 'Export Reporter List into Excel or CSV',
      auth: { scope: ['reporter'] },
      validate: reportersBaseConfig().query,
    },
  },
  {
    method: 'PUT',
    path: '/site/disable/{siteId}',
    handler: asyncHandler(disableSite),
    config: {
      description: 'Disable Site',
      notes: 'Id of the site to disable',
      auth: { scope: ['site:admin'] },
      validate: {
        params: {
          siteId: Joi.string().description('Site ID').required(),
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/site',
    handler: createSite,
    config: {
      description: 'Create Site',
      notes: 'Creates a new site',
      auth: { scope: ['site:admin'] },
      validate: postSchema,
    },
  },
  {
    method: 'GET',
    path: '/site/reportingSites',
    handler: asyncHandler(getReportingSites),
    config: {
      description: 'Sites for Reporter Dashboard',
      notes: `List of sites with some aggregations about reporters`,
      auth: { scope: ['site:view'] },
      validate: {
        query: {
          ...reportingSitesQueryParams(),
          ...validateSortPageParams(
            'siteName',
            'samplesRegistered',
            'resultsReporting',
            'resultDownloaded',
            'requiresFollowUp',
            'followUpPending',
            'followUpConfirmed',
            'followUpNotPossible'
          ),
        },
      },
      response: {
        schema: reportingSitesResponse(),
      },
    },
  },
]
module.exports = { routes }
