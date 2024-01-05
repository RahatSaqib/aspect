const Joi = require('@hapi/joi')

const reportingSitesQueryParams = () => {
  return {
    minDate: Joi.date().timestamp().required().description('Test start date'),
    maxDate: Joi.date().timestamp().required().description('Test end date'),
    countryId: Joi.number().allow(null, '').description('Filter for Country ID'),
    stateId: Joi.number().allow(null, '').description('Filter for State ID'),
    siteId: Joi.number().allow(null, '').description('Filter for Site ID'),
    assayId: Joi.number().allow(null, '').description('Filter for Assay ID'),
  }
}

const reportingSitesResponse = () => {
  return Joi.array().items(
    Joi.object({
      siteName: Joi.string().required(),
      samplesRegistered: Joi.number().integer().min(0).required(),
      resultsReporting: Joi.number().integer().min(0).required(),
      resultsDownloaded: Joi.number().integer().min(0).required(),
      requiresFollowUp: Joi.number().integer().min(0).required(),
      followUpPending: Joi.number().integer().min(0).required(),
      followUpConfirmed: Joi.number().integer().min(0).required(),
      followUpNotPossible: Joi.number().integer().min(0).required(),
    })
  )
}

module.exports = {
  reportingSitesQueryParams,
  reportingSitesResponse,
}
