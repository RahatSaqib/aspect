const Joi = require('@hapi/joi')
const { asyncHandler } = require('../routes')
const { listDiseases } = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/diseases',
    handler: asyncHandler(listDiseases),
    config: {
      description: 'Disease List',
      notes: 'List of assay types',
      auth: { scope: ['assay'] },
      response: {
        options: {
          allowUnknown: false,
        },
        schema: Joi.object().keys({
          ok: Joi.bool().required().description('False if there was some sort of error'),
          total: Joi.number().required().description('The total number of disease that match the given filters'),
          length: Joi.number().required().description('The number of disease included in this response'),
          data: Joi.array()
            .required()
            .description('The diseases list')
            .items(
              Joi.object().keys({
                id: Joi.number().positive().required().description('The id of disease'),
                name: Joi.string().required().description('The name of the disease'),
                i18nKey: Joi.string().required().description('Translation key'),
                externalId: Joi.string().required().description('Unique ID of the disease'),
                hasResults: Joi.bool().allow(null).description('If disease is used by any result'),
              })
            ),
        }),
      },
    },
  },
]

module.exports = { routes }
