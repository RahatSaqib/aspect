const Joi = require('@hapi/joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const {
  validateAllGeographyFilterParams,
} = require('../geography/requestValidation')
const {
  getCases,
  onCaseAdded,
  onCaseUpdated,
  getAutoCompleteCases,
  onResultLogged,
} = require('./service')

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
          patientOrCaseId: Joi.string()
            .allow('')
            .description('Filter for patient/case ID'),
          sampleOriginSite: Joi.string().description(
            'Filter for sample origin site site name'
          ),
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
                sampleOriginSite: Joi.string().description(
                  "The sample's origin site of the case's last result"
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
                diseaseI18nKey: Joi.string().description(
                  "The disease i18n key of the case's last result"
                ),
                diseaseId: Joi.number().description(
                  "The disease id of the case's last result"
                ),
                diseaseExternalId: Joi.string().description(
                  "The disease external id of the case's last result"
                ),
                createdOn: Joi.date().description(
                  'The creation date of the case'
                ),
                updatedOn: Joi.date().description(
                  'The update date of the case'
                ),
                createdBy: Joi.string().description(
                  "The username responsible of case's creation"
                ),
                updatedBy: Joi.string().description(
                  "The username responsible of case's update"
                ),
              })
            ),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/case/auto',
    handler: asyncHandler(getAutoCompleteCases),
    config: {
      auth: { scope: ['case'] },
      description: 'Autocomplete Cases List',
      notes: 'list of cases',
      validate: {
        query: {
          externalId: Joi.string()
            .required()
            .description('Filter for external ID'),
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
              })
            ),
        }),
      },
    },
  },
]

const subscriptions = [
  {
    actions: {
      CASE_ADDED: onCaseAdded,
      CASE_UPDATED: onCaseUpdated,
      RESULT_LOGGED: onResultLogged,
    },
  },
]

module.exports = { routes, subscriptions }
