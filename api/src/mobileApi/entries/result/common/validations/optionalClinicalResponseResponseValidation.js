const Joi = require('@hapi/joi')

const optionalClinicalResponseResponseValidation = Joi.object()
  .optional()
  .description('Clinical Response schema used in Aspect Mobile')
  .keys({
    clinicalResponse: {
      resultId: Joi.number().allow(null, '').description('Unique ID of the result for this instance of Aspect'),
      confirmedOn: Joi.date()
        .allow(null, '')
        .description('Date & time that checkbox was checked, if not checked, return null'),
      outcome: Joi.string().allow(null, '').description('Who transferred result to another clinic'),
      outcomeOccurred: Joi.date().allow(null, '').description('When result was transferred to another clinic'),
      recorded: Joi.boolean().optional().allow(null, '').description('True to search only among Transferred results'),
      treatment: Joi.string().allow(null, '').description('Who transferred result to another clinic'),
      treatmentStarted: Joi.date().allow(null, '').description('When result was transferred to another clinic'),
    },
  })

module.exports = { optionalClinicalResponseResponseValidation }
