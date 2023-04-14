const Joi = require('@hapi/joi')

const serverWorkflowResponseValidation = () => {
  return Joi.object().keys({
    workflowStatus: Joi.object()
      .description('Current workflow status of the result')
      .keys({
        changedOn: Joi.date().description('Date of the latest change to the workflow status'),
        createdOn: Joi.date().description('Date of creation of the workflow status'),
        externalId: Joi.string().description('External ID of the workflow status'),
        i18nKey: Joi.string().description('i18nKey ID of the workflow status'),
        name: Joi.string().description('Name of the workflow status'),
        reason: Joi.string().description('Reason for the latest workflow status change').allow(null, ''),
        setDelivered: Joi.boolean().optional().allow(null).description('Tells if the record was updated manually'),
      }),
  })
}
module.exports = { serverWorkflowResponseValidation }
