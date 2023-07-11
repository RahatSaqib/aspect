const Joi = require('@hapi/joi')

const downloadApplicationConfigResponseValidation = () => {
  return Joi.object().keys({
    ok: Joi.bool().required().description('False if there was some sort of problem'),
    data: Joi.object().keys({
      treatmentStatusList: Joi.array()
        .required()
        .description('All of the treatment statuses that an entry can be in')
        .items(
          Joi.object().keys({
            id: Joi.string().required().description('External ID of the treatment status, example AwaitingTreatment'),
            name: Joi.string().required().description('Name of the treatment status, example Awaiting Treatment'),
            i18nKey: Joi.string().required().description('Treatment status i18nKey used, example AwaitingTreatment'),
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
      systemConfig: Joi.object().keys({
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
    }),
  })
}

module.exports = { downloadApplicationConfigResponseValidation, downloadSystemConfigResponseValidation }
