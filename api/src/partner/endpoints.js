const Joi = require('@hapi/joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listPartners, showPartner, updatePartnerInventory } = require('./service')
const getCurrentPartner = require('./getCurrentPartner')
const { listPartnersForSelectList } = require('./listPartnersForSelectList')

const routes = [
  {
    method: 'GET',
    path: '/partner',
    handler: asyncHandler(listPartners),
    config: {
      description: 'Partner List',
      notes: 'Pageable and sortable list of partners',
      auth: { scope: ['device', 'site', 'partner'] },
      validate: {
        query: {
          name: Joi.string().allow('').description('Filter for partner name'),
          ...validateSortPageParams('name', 'partnerTypeName'),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/partner/{partnerId}',
    handler: asyncHandler(showPartner),
    config: {
      description: 'Partner Detail',
      notes: 'Detail of a partner',
      auth: { scope: ['device', 'site', 'partner'] },
      validate: {
        params: {
          partnerId: Joi.string().description('Partner ID').required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/partner/current-partner',
    handler: request => getCurrentPartner(request.auth),
    config: {
      auth: { scope: ['browse'] },
      description: 'Current Partner',
      notes: 'Get current partner with configuration data',
    },
  },
  {
    method: 'GET',
    path: '/partner/select-list',
    handler: asyncHandler(listPartnersForSelectList),
    config: {
      auth: { scope: ['device:view'] },
      description: 'List Partners for Select List',
      notes: "List of Partners ID's and names",
      validate: {
        query: {
          partnerType: Joi.string().allow('').description('Filter for partner type externalId'),
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/partner/current-partner/inventory',
    handler: asyncHandler(updatePartnerInventory),
    config: {
      auth: { scope: ['partner'] },
      description: 'Update partner inventory',
      notes: 'Update current partner inventory configuration',
      validate: {
        payload: {
          inventoryAdjustment: Joi.string().allow('', null),
          inventoryStrategy: Joi.string().allow('', null),
        },
      },
    },
  },
]

module.exports = { routes }
