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
  issueTypeName: Joi.bool().allow(null).description('Issue Type Name'),
  ...notificationHistoyCommomFields,
}

const notificationHistoryResponse = {
  id: Joi.number().description('id'),
  issueId: Joi.number().allow(null).description(`Notification's issueId`),
  resultId: Joi.number().allow(null).description(`Notification's resultId`),
  data: Joi.object().allow(null).description('data which contains sample id and patient id OR report name'),
  recepientName: Joi.string().allow(null, '').description('The Recipient Name'),
  webhookRecepient: Joi.string().allow(null, '').description('The webhook Recipient'),
  webHookStatus: Joi.string().allow(null, '').description('Webhook Status'),
  smsStatus: Joi.string().allow(null, '').description('sms Status'),
  emailStatus: Joi.string().allow(null, '').description('Email Status'),
  ...notificationHistoyCommomFields,
}
module.exports = { notificationHistoryQuery, notificationHistoryResponse }
