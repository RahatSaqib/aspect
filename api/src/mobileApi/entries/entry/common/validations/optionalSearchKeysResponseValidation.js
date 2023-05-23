const Joi = require('@hapi/joi')

const filterMeta = Joi.object({
  entryType: Joi.string().optional().description('The type of entry for filtering.'),
  treatmentStatus: Joi.string().optional().description('The treatment status for filtering.'),
  transferStatus: Joi.string().optional().description('The transfer status for filtering.'),
  assayType: Joi.string().optional().description('The assay type for filtering.'),
})

const optionalSearchKeysResponseValidation = Joi.object()
  .optional()
  .description('Keys that are generated to use for the search documents in Aspect Mobile')
  .keys({
    id: Joi.string().optional().description('The ID of the search.'),
    sampleId: Joi.string().optional().description('The sample ID for searching.'),
    sampleIdFlat: Joi.string().optional().description('The flattened version of the sample ID for searching.'),
    sampleSite: Joi.string().optional().description('The sample site for searching.'),
    patientId: Joi.string().optional().description('The patient ID for searching.'),
    platform: Joi.string().optional().description('The platform used for the search.'),
    filterMeta: filterMeta.optional().description('Additional filter metadata.'),
  })

module.exports = { optionalSearchKeysResponseValidation }
