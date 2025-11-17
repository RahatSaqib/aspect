const Joi = require('@hapi/joi')

const optionalFollowUpsResponseValidation = Joi.object()
  .optional()
  .keys({
    followUps: Joi.array()
      .description('Result Follow Ups')
      .items(
        Joi.object().keys({
          id: Joi.number().required().description('Result follow up ID'),
          resultId: Joi.number().required().description('Result ID'),
          externalId: Joi.string().allow(null, '').description('External ID of the follow up'),
          reason: Joi.string().allow(null, '').description('Reason for the follow up'),
          date: Joi.date().allow(null, '').description('When the follow up started'),
          createdOn: Joi.date().required().description('When the follow up was first created in Aspect'),
          updatedOn: Joi.date().required().description('When the follow up was last updated in Aspect'),
          followUpExternalId: Joi.string().required().description('External ID of the follow up'),
          followUpName: Joi.string().required().description('Name of the follow up'),
          followUpi18nKey: Joi.string().required().description('Translation key for the follow up'),
          followUpTypeName: Joi.string().required().description('Name of the follow up type'),
          followUpTypeExternalId: Joi.string().required().description('External ID of the follow up type'),
          followUpTypeI18nKey: Joi.string().required().description('Translation key for the follow up type'),
          clinicianName: Joi.optional().allow('', null).description('The name of clinician who took the action'),
        })
      ),
  })
module.exports = { optionalFollowUpsResponseValidation }
