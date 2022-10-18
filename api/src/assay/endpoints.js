const Joi = require('@hapi/joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listAssays, listAssayTypes, listAssaysResultSchema } = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/assay',
    handler: asyncHandler(listAssays),
    config: {
      description: 'Assay List',
      notes: 'Pageable and sortable list of assays',
      auth: { scope: ['assay'] },
      validate: {
        query: {
          name: Joi.string().allow('').description('Filter for assay name'),
          ...validateSortPageParams('name', 'assayTypeName'),
        },
      },
      response: {
        options: {
          allowUnknown: true,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if error occured'),
          total: Joi.number().required().description('The total number of assays that match the given filters'),
          length: Joi.number().required().description('The number of assays in this response'),
          data: Joi.array()
            .required()
            .description('Return assays items')
            .items(
              Joi.object().keys({
                id: Joi.number().description('The assay Id').required(),
                externalId: Joi.string().description('The external id of the assay'),
                i18nKey: Joi.string().description('i18nKey ID of the assay name'),
                assayTypeId: Joi.number().description('The assay type id'),
                diseaseId: Joi.number().allow(null).description('The disease Id'),
                name: Joi.string().description('The assay name'),
                assayTypeName: Joi.string().description('The assay type Name'),
                deviceTypeId: Joi.number().description('The device type id'),
                deviceTypeExternalId: Joi.string().description('The device type external id'),
                deviceTypeName: Joi.string().description('The device type Name'),
                resultCategory1Label: Joi.string().allow(null).description('The result category 1 label'),
                resultCategory1i18nKey: Joi.string().allow(null).description('The result category label key i18n'),
                resultCategory2Label: Joi.string().allow(null).description('The result category 2 label'),
                resultCategory2i18nKey: Joi.string().allow(null).description('The result category 2 label key i18n'),
                resultDataSchema: Joi.object().allow(null).description('The json for the result data schema field'),
                patientDataSchema: Joi.object().allow(null).description('The json for the patient data schema field'),
                abbreviation: Joi.string().min(0).description('The assay abbreviation'),
                assayTypeAbbreviation: Joi.string().allow(null).description('The assay type abbreviation'),
                resultCategories: Joi.array().allow(null).description('The json for result Categories'),
                resultCategoryGroups: Joi.array()
                  .allow(null)
                  .description(`The json for ResultCategoryGroup items of current assay`),
                hasResults: Joi.bool().allow(null).description('If assay is used by any result'),
                abilities: Joi.array()
                  .allow(null)
                  .description('The array with user abilities for each assay')
                  .items(
                    Joi.object().keys({
                      partnerId: Joi.number().description('The partner Id').required(),
                      canCreate: Joi.bool().allow(null).description('User can create assay for current partner'),
                      canDelete: Joi.bool().allow(null).description('User can delete assay for current partner'),
                      canEdit: Joi.bool().allow(null).description('User can edit assay for current partner'),
                    })
                  ),
              })
            ),
        }),
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
      auth: { scope: ['assay'] },
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
      auth: { scope: ['assay'] },
      response: {
        options: {
          allowUnknown: true,
        },

        schema: Joi.array().items(
          Joi.object().keys({
            externalId: Joi.string().description('The external id of the assay'),
            assayId: Joi.number().description('The assay Id'),
            name: Joi.string().description('The assay Name'),
            assayTypeName: Joi.string().description('The assay type Name'),
            deviceTypeExternalId: Joi.string().description('The device type id'),
            deviceTypeName: Joi.string().description('The device type Name'),
            resultCategory1Label: Joi.string().allow(null).description('The result category 1 label'),
            resultCategory1i18nKey: Joi.string().allow(null).description('The result category label key i18n'),
            resultCategory2Label: Joi.string().allow(null).description('The result category 2 label'),
            resultCategory2i18nKey: Joi.string().allow(null).description('The result category 2 label key i18n'),
            resultDataSchema: Joi.object().allow(null).description('The json object for the result data schema field'),
            patientDataSchema: Joi.object()
              .allow(null)
              .description('The json object for the patient data schema field'),
            resultCategories: Joi.array().allow(null).description('The json object for result Categories'),
            assayTypeAbbreviation: Joi.string().allow(null).description('The assay type abbreviation'),
            abbreviation: Joi.string().min(0).description('The assay abbreviation'),
          })
        ),
      },
    },
  },
]

module.exports = { routes }
