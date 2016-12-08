const Joi = require('joi')

function validateAllGeographyFilterParams() {
  return {
    countryId: Joi.number().allow('').description('Country ID'),
    stateId: Joi.number().allow('').description('State ID'),
    lgaId: Joi.number().allow('').description('LGA ID'),
  }
}

module.exports = {
  validateAllGeographyFilterParams
}
