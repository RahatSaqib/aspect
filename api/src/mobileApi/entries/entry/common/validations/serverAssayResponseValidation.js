const Joi = require('@hapi/joi')

const serverAssayResponseValidation = () => {
  return {
    assayAvatar: Joi.object()
      .description('The assay avatar')
      .keys({
        contentI18nKey: Joi.string().allow(null).description('Translation key for the content text'),
        contentText: Joi.string().allow(null).description('Name of the content text'),
        backgroundColor: Joi.string().allow(null).description('Background color code'),
        foregroundColor: Joi.string().allow(null).description('Foreground color code'),
        contentIcon: Joi.string().allow(null).description('Icon of content'),
      }),
  }
}
module.exports = { serverAssayResponseValidation }
