const Joi = require('@hapi/joi')

const serverTransferResponseValidation = Joi.object()
  .description('Server transfer information')
  .keys({
    transferStatus: Joi.object()
      .description('Transfer status information.')
      .keys({
        canBeTransferred: Joi.boolean().required().description('Specifies if the transfer can be performed.'),
        previousReportableSiteId: Joi.number()
          .optional()
          .allow(null, '')
          .description('The ID of the previous reportable site.'),
        reportableSiteId: Joi.number().optional().allow(null, '').description('The ID of the current reportable site.'),
        resultId: Joi.number().optional().allow(null, '').description('The ID of the result.'),
        siteId: Joi.number().optional().allow(null, '').description('The ID of the site.'),
        comment: Joi.string().allow(null, '').optional().description('A comment related to the transfer process.'),
        siteExternalId: Joi.string().allow(null, '').optional().description('The external ID of the site.'),
        siteName: Joi.string().allow(null, '').optional().description('The name of the site.'),
        transferStatus: Joi.optional().allow(null, '').description('The transfer status.'),
        transferredBy: Joi.string().allow(null, '').optional().description('The user who performed the transfer.'),
        transferredOn: Joi.optional()
          .allow(null, '')
          .description('The date and time when the transfer occurred in ISO 8601 format.'),
      }),
  })

module.exports = { serverTransferResponseValidation }
