const Joi = require('@hapi/joi')

const serverTransferResponseValidation = () => {
  return Joi.object().keys({
    transferStatus: Joi.object()
      .required()
      .keys({
        reportableSiteId: Joi.number().allow(null).description('Reportable siteId of the patient'),
        reportableSiteName: Joi.string()
          .allow('', null)
          .description('The name of reportable site, differ from siteName when transferred'),
        transferred: Joi.string()
          .allow(null)
          .description('The result has transferred to another clinic, probable value : Here or Away'),
        transferredOn: Joi.date().allow(null).description('When result was transferred to another clinic'),
        transferredBy: Joi.string().allow(null).description('Who transferred result to another clinic'),
      }),
  })
}
module.exports = { serverTransferResponseValidation }
