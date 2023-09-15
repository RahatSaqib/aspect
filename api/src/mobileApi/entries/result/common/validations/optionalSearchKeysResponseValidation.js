const Joi = require('@hapi/joi')

const filterMeta = Joi.object({
  entryType: Joi.string().allow(null, '').description('The type of entry for filtering.'),
  treatmentStatus: Joi.string().allow(null, '').description('The treatment status for filtering.'),
  transferStatus: Joi.string().allow(null, '').description('The transfer status for filtering.'),
  assayType: Joi.string().allow(null, '').description('The assay type for filtering.'),
  requiresFollowUp: Joi.bool().required().description('Whether the entry requires a follow-up for filtering'),
  hasFollowUp: Joi.bool().required().description('Whether the entry has been followed up on for filtering'),
  noFollowUpPossible: Joi.bool()
    .required()
    .description('Whether it is possible for a follow-up to be done on the entry for filtering'),
  followUpStatus: Joi.string().required().description('Follow up status of the entry'),
})

const optionalSearchKeysResponseValidation = Joi.object()
  .optional()
  .description('Keys that are generated to use for the search documents in Aspect Mobile')
  .keys({
    searchSchema: Joi.object().keys({
      id: Joi.string().description('The ID of the search.'),
      sampleId: Joi.string().allow(null, '').description('The sample ID for searching.'),
      sampleIdFlat: Joi.string()
        .optional()
        .allow(null, '')
        .description('The flattened version of the sample ID for searching.'),
      sampleSite: Joi.string().allow(null, '').description('The sample site for searching.'),
      patientId: Joi.string().allow(null, '').description('The patient ID for searching.'),
      platform: Joi.string().description('The platform key used for the all search filters.'),
      filterMeta: filterMeta.description('Additional filter metadata.'),
    }),
  })

module.exports = { optionalSearchKeysResponseValidation }
