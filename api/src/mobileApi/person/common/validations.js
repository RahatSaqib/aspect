const Joi = require('@hapi/joi')

const preferencePayloadValidation = () => {
  return Joi.object().keys({
    timezone: Joi.string().max(255).allow('', null).description('User timezone'),
    culture: Joi.string().max(45).description('User language'),
  })
}

const preferenceUpdateResponseValidation = () => {
  return Joi.object().keys({
    ok: Joi.bool().required().description('False if there was some sort of error'),
    data: Joi.string().description('Success of update preference'),
  })
}

module.exports = {
  preferencePayloadValidation,
  preferenceUpdateResponseValidation,
}
