const Joi = require('@hapi/joi')

const optionalTreatmentResponseValidation = Joi.object()
  .optional()
  .keys({
    treatmentStatus: Joi.object()
      .allow(null, '')
      .description('Current treatment status of the result')
      .keys({
        resultId: Joi.number().allow(null, '').description('ID of the entry'),
        changedOn: Joi.date().allow(null, '').description('Date of the latest change to the treatment status'),
        externalId: Joi.string().allow(null, '').description('External ID of the treatment status'),
        i18nKey: Joi.string().allow(null, '').description('i18nKey ID of the treatment status'),
        name: Joi.string().allow(null, '').description('Name of the treatment status'),
        visible: Joi.allow(null, '').description('External ID of the treatment status'),
        severity: Joi.string().allow(null, '').description('External ID of the treatment status'),
        daysInCurrentStatus: Joi.number().allow(null, '').description('External ID of the treatment status'),
      }),
  })

module.exports = { optionalTreatmentResponseValidation }
