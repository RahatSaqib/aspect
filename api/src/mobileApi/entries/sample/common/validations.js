const Joi = require('@hapi/joi')

const sampleRegistrationPayloadValidation = () => {
  return Joi.object().keys({
    externalId: Joi.string().required().max(255).description('Generated Sample ID'),
    collectedOn: Joi.date().iso().required().description('Sample Collection Date'),
    clinicianName: Joi.string()
      .allow(null)
      .max(255)
      .description('Optional: Name of Clinician that Collected the Sample'),
    patientId: Joi.string().allow(null).max(255).description('Optional: Sample Collected from Patient ID'),
    originSiteId: Joi.number().required().description('Site where the Sample was Collected'),
  })
}

const sampleRegistrationResponseValidation = () => {
  return Joi.object().keys({
    ok: Joi.bool().required().description('False if there was some sort of error'),
  })
}

const samplesRegisteredResponseValidation = () => {
  return Joi.object().keys({
    ok: Joi.bool().required().description('False if there was some sort of error'),
  })
}

module.exports = {
  sampleRegistrationPayloadValidation,
  sampleRegistrationResponseValidation,
  samplesRegisteredResponseValidation,
}
