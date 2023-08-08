const Joi = require('@hapi/joi')

const createServerSiteValidation = () =>
  Joi.object()
    .optional()
    .description('AN object representing a laboratory, clinic or warehouse locaiton')
    .keys({
      id: Joi.number().optional().allow(null, '').description('The ID of the site.'),
      externalId: Joi.string().allow(null, '').optional().description('The external ID of the site.'),
      name: Joi.string().allow(null, '').optional().description('The name of the site.'),
    })

module.exports = { createServerSiteValidation }
