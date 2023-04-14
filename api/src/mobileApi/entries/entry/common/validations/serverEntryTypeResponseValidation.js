const Joi = require('@hapi/joi')

const serverEntryTypeResponseValidation = () => {
  return Joi.object().keys({
    entryType: Joi.object()
      .required()
      .keys({
        i18nKey: Joi.string().description('Test type key'),
        text: Joi.string().description('Test type text'),
      }),
  })
}
module.exports = { serverEntryTypeResponseValidation }
