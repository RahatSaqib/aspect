const Joi = require('@hapi/joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const {
  validateAllGeographyFilterParams,
} = require('../geography/requestValidation')
const { getCases } = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/case',
    handler: asyncHandler(getCases),
    config: {
      description: 'Case List',
      notes: 'Pageable and sortable list of cases',
      auth: { scope: ['case'] },
      timeout: {
        server: 360000,
        socket: false,
      },
      validate: {
        query: {
          patientOrResearchId: Joi.string()
            .allow('')
            .description('Filter for patient/research ID'),
          sampleOriginSite: Joi.number()
            .description('Filter for sample origin site ID'),
          diseaseId: Joi.number()
            .allow('')
            .description('Filter for disease ID'),
          ...validateAllGeographyFilterParams(),
          ...validateSortPageParams(),
        },
      },
      response: {
        schema: Joi.object().keys({
          ok: Joi.bool()
            .required()
            .description('False if there was some sort of error'),
          total: Joi.number()
            .required()
            .description(
              'The total number of cases that match the given filters'
            ),
          length: Joi.number()
            .required()
            .description('The number of cases included in this response'),
          data: Joi.array()
            .required()
            .description('The cases')
            .items(
              Joi.object().keys({
                id: Joi.number().description('The id of the case'),
                externalId: Joi.string().description(
                  'The external id of the case'
                ),
                attendingClinic: Joi.string().description(
                  "The attending clinic or sample's origin site of the case's last result"
                ),
                status: Joi.string().description(
                  'The outcome status of the case'
                ),
                patientId: Joi.string().description(
                  "The patient id of the case's last result"
                ),
                diseaseName: Joi.string().description(
                  "The disease name of the case's last result"
                ),
                diseaseId: Joi.number().description(
                  "The disease id of the case's last result"
                ),
                diseaseExternalId: Joi.string().description(
                  "The disease external id of the case's last result"
                ),
                patientId: Joi.string().description(
                  "The patient id of the case's last result"
                ),
              })
            ),
        }),
      },
    },
  },
]

module.exports = { routes }
