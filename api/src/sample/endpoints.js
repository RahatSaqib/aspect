const Joi = require('@hapi/joi')
const { asyncHandler, validateSortPageParams, validateDateRangeParams } = require('../routes')
const { listSamples } = require('./service')
const { validateAllGeographyFilterParams } = require('../geography/requestValidation')

const routes = [
  {
    method: 'GET',
    path: '/sample',
    handler: asyncHandler(listSamples),
    config: {
      description: 'Sample List',
      notes: 'Pageable and sortable list of samples with filters',
      auth: { scope: ['sample:view'] },
      validate: {
        query: {
          siteName: Joi.string().allow('').description('Filter for site name'),
          sampleId: Joi.string().allow('').description('Filter for sample ID'),
          patientId: Joi.string().allow('').description('Filter for patient ID'),
          ...validateAllGeographyFilterParams(),
          ...validateDateRangeParams('minDate', 'maxDate'),
          ...validateSortPageParams(
            'sampleCollectedOn',
            'sampleCollectionSite',
            'sampleCollectedBy',
            'sampleExternalId',
            'patientId',
            'dateUploadedToAspect',
            'resultDate'
          ),
        },
      },
      response: {
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          total: Joi.number().required().description('The total number of records that match the given filters'),
          length: Joi.number().required().description('The length of returned data'),
          data: Joi.array().items(
            Joi.object({
              sampleId: Joi.number().required().description('Sample ID'),
              sampleExternalId: Joi.string().allow(null).description('Sample External ID'),
              sampleCollectedOn: Joi.date().allow(null).description('Sample Collection Date'),
              sampleCollectionSite: Joi.string().allow(null).description('Sample Collection Site'),
              sampleCollectedBy: Joi.string().allow(null).description('Sample Collected By'),
              patientId: Joi.string().allow(null).description('Patient ID'),
              dateUploadedToAspect: Joi.date().allow(null).description('Date Uploaded to Aspect'),
              resultId: Joi.number().allow(null).description('Result ID if exists'),
              resultDate: Joi.date().allow(null).description('Result Date if exists'),
              resultText: Joi.string().allow('', null).description('Result Text if exists'),
            })
          ),
        }),
      },
    },
  },
]

module.exports = { routes }
