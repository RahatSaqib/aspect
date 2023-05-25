const Joi = require('@hapi/joi')

const serverTransferResponseValidation = Joi.object()
  .description('Server transfer information')
  .keys({
    transferStatus: Joi.object()
      .description('Transfer status information.')
      .keys({
        canBeTransferred: Joi.boolean().required().description('Specifies if the transfer can be performed.'),
        previousReportableSiteId: Joi.number().optional().description('The ID of the previous reportable site.'),
        reportableSiteId: Joi.number().optional().description('The ID of the current reportable site.'),
        resultId: Joi.number().optional().description('The ID of the result.'),
        siteId: Joi.number().optional().description('The ID of the site.'),
        comment: Joi.string().optional().description('A comment related to the transfer process.'),
        siteName: Joi.string().optional().description('The name of the site.'),
        transferStatus: Joi.optional().description('The transfer status.'),
        transferredBy: Joi.string().optional().description('The user who performed the transfer.'),
        transferredOn: Joi.optional().description('The date and time when the transfer occurred in ISO 8601 format.'),
      }),
  })

module.exports = { serverTransferResponseValidation }
