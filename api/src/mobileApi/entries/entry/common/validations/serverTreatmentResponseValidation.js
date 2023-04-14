const Joi = require('@hapi/joi')

const serverTreatmentResponseValidation = () => {
  return Joi.object().keys({
    treatmentStatus: Joi.object()
      .allow(null)
      .description('Current treatment status of the result')
      .keys({
        changedOn: Joi.date().description('Date of the latest change to the treatment status').allow(null),
        externalId: Joi.string().description('External ID of the treatment status').allow(null),
        i18nKey: Joi.string().description('i18nKey ID of the treatment status').allow(null),
        name: Joi.string().description('Name of the treatment status').allow(null),
        visible: Joi.boolean().description('External ID of the treatment status').allow(null),
        severity: Joi.string().description('External ID of the treatment status').allow(null),
        daysInCurrentStatus: Joi.string().description('External ID of the treatment status').allow(null),
      }),
  })
}
module.exports = { serverTreatmentResponseValidation }
