const Joi = require('@hapi/joi')

const serverBaseResponseValidation = () => {
  return Joi.object().keys({
    ok: Joi.bool().required().description('False if there was some sort of error'),
    total: Joi.number().required().description('The total number of results that match the given filters'),
    awaitingTreatment: Joi.number().required().description('The total number of awaiting treatments'),
    length: Joi.number().required().description('The number of results included in this response'),
    offset: Joi.number().required().description('Current page number'),
    pages: Joi.number().required().description('Total number of pages'),
    nextPage: Joi.number().allow(false).description('Next page to call for more records'),
    hasNext: Joi.bool().allow(false).description('If there is next page then it will be true else it will be false'),
  })
}

module.exports = { serverBaseResponseValidation }
