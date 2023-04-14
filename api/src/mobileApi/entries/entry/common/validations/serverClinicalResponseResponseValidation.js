const Joi = require('@hapi/joi')

const serverClinicalResponseResponseValidation = () => {
  return Joi.object().keys({
    clinicalResponse: {
      recorded: Joi.boolean().optional().allow(null).description('True to search only among Transferred results'),
      confirmedOn: Joi.date()
        .allow(null)
        .description('Date & time that checkbox was checked, if not checked, return null'),
      treatment: Joi.string().allow(null, '').description('Who transferred result to another clinic'),
      treatmentStarted: Joi.date().allow(null).description('When result was transferred to another clinic'),
      outcome: Joi.string().allow(null, '').description('Who transferred result to another clinic'),
      outcomeOccurred: Joi.date().allow(null).description('When result was transferred to another clinic'),
    },
  })
}
module.exports = { serverClinicalResponseResponseValidation }
