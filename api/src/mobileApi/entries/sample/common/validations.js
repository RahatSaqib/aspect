const Joi = require('@hapi/joi')
const {
  baseSampleSchemaResponseValidation,
} = require('../../result/common/validations/optionalSampleSchemaResponseValidation')

const sampleRegistrationPayloadValidation = () => {
  return Joi.object().keys({
    externalId: Joi.string().required().max(255).description('Generated Sample ID'),
    collectedOn: Joi.date().iso().allow(null, '').description('Optional Sample Collection Date'),
    clinicianName: Joi.string()
      .allow(null, '')
      .max(255)
      .description('Optional: Name of Clinician that Collected the Sample'),
    patientExternalId: Joi.string()
      .allow(null, '')
      .max(255)
      .description(
        'Optional: Sample Collected from Patient ID, not to be confused with the current patientId column as this is an index from the Patient table'
      ),
    originSiteId: Joi.number().required().description('Site where the Sample was Collected'),
  })
}

const sampleRegistrationResponseValidation = () => {
  return Joi.object().keys({
    ok: Joi.bool().required().description('False if there was some sort of error'),
    data: baseSampleSchemaResponseValidation,
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
