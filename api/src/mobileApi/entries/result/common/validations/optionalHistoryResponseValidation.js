const Joi = require('@hapi/joi')

const optionalHistoryResponseValidation = Joi.object()
  .optional()
  .keys({
    history: Joi.array()
      .allow(null, '')
      .description('Entry history events')
      .items(
        Joi.object().keys({
          id: Joi.number().required().description('Entry event ID'),
          resultId: Joi.number().required().description('Entry ID'),
          event: Joi.string().required().description('Entry event key used as ID, example: transferEvent'),
          name: Joi.required().description('Entry event name used as label, example: awayTransfer'),
          siteName: Joi.string().required().description('Entry event site name derived from siteId'),
          updatedOn: Joi.required().description('When the entry event was last updated in the Aspect database'),
          reason: Joi.optional().allow('', null).description('The reason for the follow up being recorded'),
          clinicianName: Joi.optional().allow('', null).description('The name of clinician who took the action'),
          type: Joi.optional().allow('', null).description('The follow up type'),
        })
      ),
  })

module.exports = { optionalHistoryResponseValidation }
