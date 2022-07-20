const Joi = require('@hapi/joi')

const updateSchema = {
  params: {
    siteId: Joi.number().integer().positive().description('Site id').required(),
  },
  payload: {
    name: Joi.string().required(),
    shortName: Joi.string().required(),
    externalId: Joi.string().allow('', null),
    timezone: Joi.string().allow('', null),
    countryId: Joi.number().integer().positive().allow('', null),
    stateId: Joi.number().integer().positive().allow('', null),
    lgaId: Joi.number().integer().positive().allow('', null),
    street1: Joi.string().allow('', null),
    street2: Joi.string().allow('', null),
    city: Joi.string().allow('', null),
    zip: Joi.string().max(45).allow('', null),
    longitude: Joi.number().allow('', null),
    latitude: Joi.number().allow('', null),
  },
}

const postSchema = {
  payload: {
    name: Joi.string().max(255).required(),
    shortName: Joi.string().max(45).required(),
    notes: Joi.string().max(2000).allow('', null),
    countryId: Joi.number().integer().positive().allow('', null),
    stateId: Joi.number().integer().positive().allow('', null),
    lgaId: Joi.number().integer().positive().allow('', null),
    city: Joi.string().allow('', null),
    street1: Joi.string().allow('', null),
    street2: Joi.string().allow('', null),
    zip: Joi.string().max(45).allow('', null),
    longitude: Joi.number().allow('', null),
    latitude: Joi.number().allow('', null),
    timezone: Joi.string().allow('', null),
    hoursStart: Joi.number().allow('', null),
    hoursEnd: Joi.number().allow('', null),
    siteTypeId: Joi.number().integer().positive().required(),
    parentWarehouseId: Joi.number().integer().positive().allow('', null),
  },
}

module.exports = { postSchema, updateSchema }
