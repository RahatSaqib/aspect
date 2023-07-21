const Joi = require('@hapi/joi')

const downloadSitesResponseValidationV4 = () => {
  return Joi.object().keys({
    ok: Joi.bool().required().description('False if there was some sort of problem'),
    data: Joi.array()
      .required()
      .description('Data for all follow ups')
      .items(
        Joi.object().keys({
          id: Joi.string().required().description('Numeric ID of the site'),
          name: Joi.string().required().description('Name of the site'),
          shortName: Joi.string().required().allow('', null).description('The short name of the site'),
          state: Joi.string().required().allow('', null).description('The name of the state where the site is located'),
          lga: Joi.string()
            .required()
            .allow('', null)
            .description('The name of the local geographic location where the site is located'),
          externalId: Joi.string().required().allow('', null).description('The text based natural ID of the site'),
        })
      ),
  })
}

module.exports = { downloadSitesResponseValidationV4 }
