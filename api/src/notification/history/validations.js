const Joi = require('@hapi/joi')

const notificationHistoyCommomFields = {
  sampleId: Joi.string().allow(null, '').description('The sample id'),
  countryId: Joi.string().allow(null, '').description('The country id'),
  notificationTypeId: Joi.string().allow(null, '').description('The country id'),
  notificationTypeCategoryId: Joi.string().allow(null, '').description('The country id'),
  patientId: Joi.string().allow(null, '').description('The patient id'),
  date: Joi.date().allow(null).description('The creation date of the notification log'),
  notificationTypeName: Joi.string().allow(null, '').description('Notification Type Category name'),
  notificationName: Joi.string().allow(null, '').description('Notification Name'),
  reportName: Joi.string().allow(null, '').description('Report Name'),
}

const notificationHistoryQuery = {
  notificationWithErrors: Joi.bool().allow(null).description('Error in SMS,Email or webhook Notification'),
  ...notificationHistoyCommomFields,
}

const notificationHistoryResponse = {
  id: Joi.number().description('id'),
  webhookSent: Joi.number().description('The number of webhook notification sent'),
  webhookWithErrors: Joi.number().description('The number of webhook notification sent but with errors'),
  webhookPending: Joi.number().description('The number of webhook notification pending to be sent'),
  smsSent: Joi.number().description('The number of sms notification sent'),
  smsWithErrors: Joi.number().description('The number of sms notification sent'),
  smsPending: Joi.number().description('The number of sms notification sent'),
  emailSent: Joi.number().description('The number of email notification sent'),
  emailWithErrors: Joi.number().description('The number of email notification sent with errors'),
  emailPending: Joi.number().description('The number of email notification pending to be send'),
  issueId: Joi.number().allow(null).description(`Notification's issueId`),
  resultId: Joi.number().allow(null).description(`Notification's resultId`),
  data: Joi.object().allow(null).description('data which contains sample id and patient id OR report name'),
  emailRecipients: Joi.array().allow(null).description('Comma-separated person names who get notification email'),
  smsRecipients: Joi.array().allow(null).description('Comma-separated person names who get notification sms'),
  webhookRecipients: Joi.array().allow(null).description('Comma-separated url who get notification the webhook'),
  ...notificationHistoyCommomFields,
}

module.exports = { notificationHistoryQuery, notificationHistoryResponse }
