const Joi = require('@hapi/joi')
const Boom = require('@hapi/boom')
const Problem = require('../../shared/problem')

const entitySchema = {
  name: Joi.string().required(),
  shortName: Joi.string().required(),
  externalId: Joi.string().allow('', null),
  notes: Joi.string().allow('', null),
  countryId: Joi.number().required().integer().positive(),
  stateId: Joi.number().integer().positive().allow('', null),
  lgaId: Joi.number().integer().positive().allow('', null),
  street1: Joi.string().allow('', null),
  street2: Joi.string().allow('', null),
  city: Joi.string().allow('', null),
  zip: Joi.string().allow('', null),
  longitude: Joi.number().allow('', null),
  latitude: Joi.number().allow('', null),
  timezone: Joi.string().allow('', null),
  hoursStart: Joi.number().allow('', null),
  hoursEnd: Joi.number().allow('', null),
  siteTypeId: Joi.number().integer().positive().required(),
  parentWarehouseId: Joi.number().integer().positive().allow('', null),
}

const updateSchema = {
  params: {
    siteId: Joi.number().integer().positive().description('Site id').required(),
  },
  payload: {
    ...entitySchema,
  },
}

const postSchema = {
  payload: {
    ...entitySchema,
  },
}

/**
 * Throws a Boom error with the result of build a @see Problem object detailing the repeated values
 * between a request params and a existing site.
 * @param {string} name - Name of the site
 * @param {string} shortName - Short Name of the site
 * @param {string} externalId - external Id (Site Id in UI) of the site
 * @param {Object} existingSite - Site object retrieved from DB
 */
function throwExistingSiteError(name, shortName, externalId, existingSite) {
  const problems = new Problem()
  if (name === existingSite.name) {
    problems.addProblem('siteNameRepeated', 'The site name already exists', 'name', name)
  }
  if (shortName === existingSite.shortName) {
    problems.addProblem('siteShortNameRepeated', 'The site short name already exists', 'shortName', shortName)
  }
  if (externalId === existingSite.externalId) {
    problems.addProblem('siteIdRepeated', 'The Site Id already exists', 'externalId', externalId)
  }

  throw Boom.conflict('', problems)
}

module.exports = { postSchema, updateSchema, throwExistingSiteError }
