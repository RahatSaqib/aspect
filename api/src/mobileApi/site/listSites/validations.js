const Joi = require('@hapi/joi')

const downloadSitesRequestValidationV4 = () => {
  return {
    query: {
      type: Joi.array()
        .single()
        .items(Joi.string())
        .optional()
        .allow(null, '')
        .description('The types of site (lab, clinic or warehouse) Defaults to clinic'),
      stateId: Joi.number()
        .optional()
        .allow(null, '')
        .description("The ID of the state of site. Defaults to the contact's state"),
    },
  }
}

const downloadSitesResponseValidationV4 = () => {
  return Joi.object().keys({
    ok: Joi.bool().required().description('False if there was some sort of problem'),
    data: Joi.array()
      .required()
      .description('Data for all follow ups')
      .items(
        Joi.object().keys({
          id: Joi.number().required().description('Numeric ID of the site'),
          name: Joi.string().required().description('Name of the site'),
          shortName: Joi.string().required().allow('', null).description('The short name of the site'),
          state: Joi.string().required().allow('', null).description('The name of the state where the site is located'),
          lga: Joi.string()
            .required()
            .allow('', null)
            .description('The name of the local geographic location where the site is located'),
          externalId: Joi.string().required().allow('', null).description('The text based natural ID of the site'),
          sampleRegistrationAllowed: Joi.bool()
            .required()
            .description('Whether the user is allowed to regsiter samples from the site'),
          onlyForTransfers: Joi.bool()
            .required()
            .description(
              'Whether the user is allowed just to create transfers (true) or also to to register samples (false)'
            ),
        })
      ),
  })
}

module.exports = { downloadSitesRequestValidationV4, downloadSitesResponseValidationV4 }
