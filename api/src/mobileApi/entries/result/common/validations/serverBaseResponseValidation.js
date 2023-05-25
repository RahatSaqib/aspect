const Joi = require('@hapi/joi')

const serverBaseResponseValidation = Joi.object().keys({
  ok: Joi.bool().required().description('False if there was some sort of error'),
  total: Joi.number().required().description('The total number of entries that match the given filters'),
  awaitingTreatment: Joi.number().required().description('The total number of awaiting treatments'),
})

module.exports = { serverBaseResponseValidation }
