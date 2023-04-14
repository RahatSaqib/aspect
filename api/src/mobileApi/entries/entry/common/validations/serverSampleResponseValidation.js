const Joi = require('@hapi/joi')

const serverSampleResponseValidation = () => {
  return Joi.object().keys({
    sample: Joi.object()
      .description('The sample that the result is based on')
      .keys({
        id: Joi.string().allow(null).description('ID of the sample'),
        originSite: Joi.object()
          .allow(null)
          .description('The site where the sample was taken')
          .keys({
            externalId: Joi.string().description('ID of the site'),
            name: Joi.string().description('Name of the site'),
          }),
      }),
  })
}
module.exports = { serverSampleResponseValidation }
