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
  // GET /assayresultandpatientschema
  {
    method: 'GET',
    path: '/assayresultandpatientschema',
    handler: asyncHandler(listAssaysResultSchema),
    config: {
      description: 'Assay List for patient and result data',
      notes: 'Get all the patient and results ',
      response: {
        options: {
          allowUnknown: true,
        },

        schema: Joi.array().items(
          Joi.object().keys({
            id: Joi.number().description('The id of the assay'),
            assayTypeId: Joi.number().description('The assayType id'),
            name: Joi.string().description('The assay Name'),
            assayTypeName: Joi.string().description('The assay type Name'),
            deviceTypeId: Joi.number().description('The device type id'),
            deviceTypeName: Joi.string().description('The device type Name'),
            resultCategory1Label: Joi.string()
              .allow(null)
              .description('The result category 1 label'),
            resultCategory1i18nKey: Joi.string()
              .allow(null)
              .description('The result category label key i18n'),
            resultCategory2Label: Joi.string()
              .allow(null)
              .description('The result category 2 label'),
            resultCategory2i18nKey: Joi.string()
              .allow(null)
              .description('The result category 2 label key i18n'),
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
