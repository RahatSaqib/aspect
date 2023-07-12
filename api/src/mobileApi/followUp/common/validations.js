const Joi = require('@hapi/joi')

const downloadFollowUpsResponseValidation = () => {
  return Joi.object().keys({
    ok: Joi.bool().required().description('False if there was some sort of problem'),
    data: Joi.array()
      .required()
      .description('Data for all follow ups')
      .items(
        Joi.object().keys({
          id: Joi.string().required().description('External ID of the follow-up, example iacc'),
          name: Joi.string()
            .required()
            .description('Name of the follow-up, example Initiate advanced adherence counselling'),
          i18nKey: Joi.string().required().description('Follow up i18nKey used, example iacc'),
          assays: Joi.array()
            .required()
            .description(
              'External IDs of all of the assays that can lead to this type of follow up, example ["GxHiv1Vl", "QHivVL", "ReporterHivVL"]'
            )
            .items(Joi.string().required().description('External ID of the assay, example GxHiv1Vl')),
        })
      ),
  })
}

module.exports = { downloadFollowUpsResponseValidation }
