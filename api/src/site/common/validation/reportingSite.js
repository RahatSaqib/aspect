const Joi = require('@hapi/joi')

const reportingSitesQueryParams = () => {
  return {
    minDate: Joi.date().iso().required().description('From Date'),
    maxDate: Joi.date().iso().required().description('To Date'),
    countryId: Joi.number().allow(null, '').description('Filter for Country ID'),
    stateId: Joi.number().allow(null, '').description('Filter for State ID'),
    siteId: Joi.number().allow(null, '').description('Filter for Site ID'),
    lgaId: Joi.number().allow(null, '').description('Filter for Lga ID'),
    assayId: Joi.number().allow(null, '').description('Filter for Assay ID'),
    siteName: Joi.string().allow('', null).description('The name of the site where the device is located'),
  }
}

const serverBaseResponseValidation = Joi.object().keys({
  ok: Joi.bool().required().description('False if there was some sort of error'),
  total: Joi.number().required().description('The total number of records that match the given filters'),
  length: Joi.number().required().description('The length of returned data'),
})

const reportingSitesResponse = () => {
  return Joi.object()
    .keys({
      data: Joi.array().items(
        Joi.object({
          siteId: Joi.number().required(),
          siteName: Joi.string().required(),
          samplesRegistered: Joi.number().integer().min(0).required(),
          resultsReporting: Joi.number().integer().min(0).required(),
          resultsDownloaded: Joi.number().integer().min(0).required(),
          requiresFollowUp: Joi.number().integer().min(0).required(),
          followUpPending: Joi.number().integer().min(0).required(),
          followUpConfirmed: Joi.number().integer().min(0).required(),
          followUpNotPossible: Joi.number().integer().min(0).required(),
        })
      ),
    })
    .concat(serverBaseResponseValidation)
}

module.exports = {
  reportingSitesQueryParams,
  reportingSitesResponse,
}
