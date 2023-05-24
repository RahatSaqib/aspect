const Joi = require('@hapi/joi')

const optionalAssayAvatarResponseValidation = Joi.object()
  .optional()
  .description('Assay Avatar schema used in Aspect Mobile')
  .keys({
    assayAvatar: {
      resultId: Joi.number().required().description('Unique ID of the result for this instance of Aspect'),
      contentI18nKey: Joi.string().required().description('Assay i18nKey used, example assayTypeMtbXdr'),
      contentText: Joi.string().required().description('Assay text used, example XDR'),
      backgroundColor: Joi.string()
        .required()
        .description('Background color used for the assay in Aspect Mobile, example orange'),
      foregroundColor: Joi.string()
        .required()
        .description('Text color used for the assay in Aspect Mobile, example secondary'),
    },
  })

module.exports = { optionalAssayAvatarResponseValidation }
