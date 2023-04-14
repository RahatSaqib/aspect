const Joi = require('@hapi/joi')

const serverTestInformationResponseValidation = () => {
  return Joi.object().keys({
    testInformation: Joi.array()
      .description('Test information list')
      .items(
        Joi.object().keys({
          testId: Joi.string().allow(null).description('Patient ID/Sample ID'),
          label: Joi.string().allow(null, '').description('Test label'),
          labelI18nKey: Joi.string().required().description('Test label key').allow(null),
          value: Joi.string().required().description('Test result value').allow(null, ''),
          valueI18nKey: Joi.string().required().description('Test result value key').allow(null, ''),
          severity: Joi.string().description('Severity of the test'),
          resultStatusLogId: Joi.number()
            .allow(null)
            .integer()
            .positive()
            .description('The id of last entry in ResultStatusLog for current result'),
        })
      ),
  })
}
module.exports = { serverTestInformationResponseValidation }
