const Joi = require('@hapi/joi')

function responseAsyncReports() {
  return {
    options: {
      allowUnknown: false,
    },
    schema: Joi.object().keys({
      total: Joi.number().required(),
      data: Joi.array()
        .required()
        .description('List of reports')
        .items(
          Joi.object().keys({
            reportId: Joi.number().required().description('Report id'),
            name: Joi.string().required().description('Report name'),
            filePath: Joi.string().allow('', null).required().description('Report description'),
            externalId: Joi.string().required().description('Report unique externalId'),
            status: Joi.string().required().description('Report status'),
            expiresOn: Joi.date().allow(null).required().description('Report expiration date'),
            createdOn: Joi.date().required().description('Report creation date'),
          })
        ),
    }),
  }
}

module.exports = { responseAsyncReports }
