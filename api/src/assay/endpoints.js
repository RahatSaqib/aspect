const Joi = require('joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listAssays, listAssaysResultSchema } = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/assay',
    handler: asyncHandler(listAssays),
    config: {
      description: 'Assay List',
      notes: 'Pageable and sortable list of assays',
      auth: { scope: ['assay:view', 'assay:edit'] },
      validate: {
        query: Object.assign(
          {
            name: Joi.string()
              .allow('')
              .description('Filter for assay name'),
          },
          validateSortPageParams('name', 'assayTypeName')
        ),
      },
    },
  },
  {
    method: 'GET',
    path: '/assayresultandpatientschema',
    handler: asyncHandler(listAssaysResultSchema),
    config: {
      description: 'Assay List for patient and result data',
      notes: 'Get all the patient and results ',
      auth: { scope: ['assay:view', 'assay:edit'] },
      response: {
        options: {
          allowUnknown: true,
        },

        schema: Joi.array().items(
          Joi.object().keys({
            assayId: Joi.number()
              .required()
              .description('The Id of the assay'),
            resultDataSchema: Joi.object()
              .allow(null)
              .description('The json object for the result data schema field'),
            patientDataSchema: Joi.object()
              .allow(null)
              .description('The json object for the result data schema field'),
            resultCategories: Joi.array()
              .allow(null)
              .description('The json object for result Categories'),
          })
        ),
      },
    },
  },
]

module.exports = { routes }
