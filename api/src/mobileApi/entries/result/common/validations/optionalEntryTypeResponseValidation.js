const Joi = require('@hapi/joi')

const optionalEntryTypeResponseValidation = Joi.object()
  .optional()
  .description('Entry type schema to help identify it in the mobile app')
  .keys({
    testType: Joi.object()
      .required()
      .keys({
        i18nKey: Joi.string().description('Test type key'),
        text: Joi.string().description('Test type text'),
      }),
  })

module.exports = { optionalEntryTypeResponseValidation }
