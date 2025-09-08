const Joi = require('@hapi/joi')

const downloadApplicationConfigResponseValidation = () => {
  return Joi.object().keys({
    ok: Joi.bool().required().description('False if there was some sort of problem'),
    data: Joi.object().keys({
      followUpStatusList: Joi.array()
        .required()
        .description('All of the treatment statuses that an entry can be in')
        .items(
          Joi.object().keys({
            id: Joi.string().required().description('External ID of the follow-up status, example AwaitingFollowUp'),
            name: Joi.string().required().description('Name of the treatment status, example Awaiting Follow-up'),
            i18nKey: Joi.string().required().description('Treatment status i18nKey used, example AwaitingFollowUp'),
          })
        ),
      transferStatusList: Joi.array()
        .required()
        .description('All of the transfer statuses that an entry can be in')
        .items(
          Joi.object().keys({
            id: Joi.string().required().description('External ID of the transfer status, example awayTransfer'),
            name: Joi.string().required().description('Name of the transfer status, example Transferred Away'),
            i18nKey: Joi.string().required().description('Transfer status i18nKey used, example awayTransfer'),
          })
        ),
      entryTypeList: Joi.array()
        .required()
        .description('All of the entry types that an entry can be')
        .items(
          Joi.object().keys({
            id: Joi.string().required().description('External ID of the entry type, example sample'),
            name: Joi.string().required().description('Name of the entry type, example Transferred Sample'),
            i18nKey: Joi.string().required().description('Sample type i18nKey used, example sample'),
          })
        ),
    }),
  })
}

const downloadSystemConfigResponseValidation = () => {
  return Joi.object().keys({
    ok: Joi.bool().required().description('False if there was some sort of problem'),
    data: Joi.object().keys({
      fetchIntervals: Joi.array()
        .required()
        .description('All of the treatment statuses that an entry can be in')
        .items(
          Joi.object().keys({
            operation: Joi.string()
              .required()
              .description('Name of the Endpoint, example Entries, Sites, Treatments, Outcomes'),
            interval: Joi.number()
              .required()
              .description(
                'Number of seconds to wait between calling the endpoint to refresh locally stored data in the app'
              ),
          })
        ),
    }),
  })
}

const retrieveAppIdConfigResponseValidation = () => {
  return Joi.object().keys({
    ok: Joi.bool().required().description('False if there was some sort of problem'),
    data: Joi.when('ok', {
      is: true,
      then: Joi.object().keys({
        appId: Joi.string().required().description('3-digit app ID assigned to the device'),
      }),
      otherwise: Joi.object().keys({
        error: Joi.string().required().description('Error message describing the problem'),
        statusCode: Joi.number().optional().description('HTTP status code for the error (409 for conflict)'),
      })
    }),
  })
}

module.exports = {
  downloadApplicationConfigResponseValidation,
  downloadSystemConfigResponseValidation,
  retrieveAppIdConfigResponseValidation,
}
