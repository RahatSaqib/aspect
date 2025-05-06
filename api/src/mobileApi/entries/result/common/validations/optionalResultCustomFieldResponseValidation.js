const Joi = require('@hapi/joi')

const optionalResultCustomFieldResponseValidation = Joi.object()
  .optional()
  .keys({
    customFields: Joi.object()
      .pattern(
        Joi.string(),
        Joi.object().pattern(
          Joi.string(),
          Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean(), Joi.date(), Joi.object())
        )
      )
      .description('Custom fields data organized by formDefinitionExternalId and fieldName'),
  })

module.exports = { optionalResultCustomFieldResponseValidation }
