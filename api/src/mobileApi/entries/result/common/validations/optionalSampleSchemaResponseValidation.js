const Joi = require('@hapi/joi')

const originSite = Joi.object({
  id: Joi.number().required().description('The ID of the origin site.'),
  stateName: Joi.string()
    .allow(null, '')
    .required()
    .description('The name of the state where the origin site is located.'),
  name: Joi.string().required().description('The name of the origin site.'),
  externalId: Joi.string().allow(null, '').required().description('The external ID of the origin site.'),
})

const sampleType = Joi.object({
  name: Joi.required().description('The name of the sample type.'),
  i18nKey: Joi.required().description('The internationalization key of the sample type.'),
  externalId: Joi.required().description('The external ID of the sample type.'),
})

const status = Joi.object({
  id: Joi.string().required().description('The ID of the status.'),
  backgroundColor: Joi.string().required().description('The background color associated with the status.'),
  label: Joi.string().required().description('The label of the status.'),
  i18nKey: Joi.string().required().description('The internationalization key of the status.'),
})

const baseSampleSchemaResponseValidation = Joi.object().keys({
  id: Joi.number().required().description('The ID of the sample.'),
  externalId: Joi.string().required().allow(null, '').description('The external ID of the sample.'),
  originSite: originSite.allow(null, '').required().description('The origin site of the sample.'),
  clinicianName: Joi.string()
    .required()
    .allow(null, '')
    .description('The name of the clinician who registered the sample.'),
  sampleType: sampleType.allow(null, '').description('The type of the sample.'),
  status: status.allow(null, '').description('The status of the sample.'),
  collectedOn: Joi.allow(null, '').description('The date and time when the sample was collected in ISO 8601 format.'),
  updatedOn: Joi.allow(null, '')
    .optional()
    .description('The date and time when the sample was last updated. Can be null if not updated.'),
})

const optionalSampleSchemaResponseValidation = Joi.object().optional().description('Sample schema for the entry').keys({
  sample: baseSampleSchemaResponseValidation,
})

module.exports = { optionalSampleSchemaResponseValidation, baseSampleSchemaResponseValidation }
