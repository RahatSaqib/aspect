const Joi = require('@hapi/joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const {
  listAssays,
  listAssayTypes,
  listAssaysResultSchema,
} = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/assay',
    handler: asyncHandler(listAssays),
    config: {
      description: 'Assay List',
      notes: 'Pageable and sortable list of assays',
      auth: { scope: ['assay:view', 'assay:edit', 'assay:admin'] },
      validate: {
        query: {
          name: Joi.string()
            .allow('')
            .description('Filter for assay name'),
          ...validateSortPageParams('name', 'assayTypeName'),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/assay-type',
    handler: asyncHandler(listAssayTypes),
    config: {
      description: 'Assay Type List',
      notes: 'List of assay types',
      auth: { scope: ['assay:view', 'assay:edit', 'assay:admin'] },
    },
  },
  // GET /assayresultandpatientschema
  {
    method: 'GET',
    path: '/assay/resultandpatientschema',
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
            externalId: Joi.string().description(
              'The external id of the assay'
            ),
            assayId: Joi.number().description('The assay Id'),
            name: Joi.string().description('The assay Name'),
            assayTypeName: Joi.string().description('The assay type Name'),
            deviceTypeExternalId: Joi.string().description(
              'The device type id'
            ),
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
              .description('The json object for the patient data schema field'),
            resultCategories: Joi.array()
              .allow(null)
              .description('The json object for result Categories'),
            assayTypeAbbreviation: Joi.string()
              .allow(null)
              .description('The assay type abbreviation'),
            abbreviation: Joi.string()
              .min(0)
              .description('The assay abbreviation'),
          })
        ),
      },
    },
  },
]

module.exports = { routes }
