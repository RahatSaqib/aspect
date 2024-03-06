const { seed, getPartnerByExternalId } = require('../utils')
const { notificationTypeCategoryToId, messageSeverityToId } = require('../../src/shared/dictionary')

const sendResultTemplate = require('../common/send_result_template')
const upsertWebHookTemplates = require('../common/upsert_webhook_templates')

// eslint-disable-next-line import/no-dynamic-require
const partnerData = require(`../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/partnerData`)

module.exports = seed(async knex => {
  const { adminUserName } = partnerData
  const { id: partnerId } = await getPartnerByExternalId(knex, partnerData.partner.externalId)

  const { id: userId } = await knex('User').where({ name: adminUserName }).first('id')
  const webhookTemplateId = await upsertWebHookTemplates(knex, [sendResultTemplate], userId)

  // MessageType
  let { id: messageTypeId } =
    (await knex('MessageType as t').where('t.webhookTemplateId', webhookTemplateId).first('t.id')) || {}
  if (!messageTypeId) {
    const messageSeverityAlertId = await messageSeverityToId('Alert')
    const messageType = {
      messageSeverityId: messageSeverityAlertId,
      webhookTemplateId,
    }
    ;[messageTypeId] = await knex('MessageType').insert(messageType)
  }

  const now = new Date()
  const auditFields = {
    createdOn: now,
    updatedOn: now,
  }

  const assays = [
    {
      assayId: 'GxMtbXdr',
      resultCategoryId: [
        [
          {
            value: 'GxMtbXdrMtbNotDetected',
            label: 'MTB Not Detected',
            scope: 'ResultCategoryGroups',
          },
          {
            value: 'GxMtbXdrMtbDetected',
            label: 'MTB Detected',
            scope: 'ResultCategoryGroups',
          },
          {
            value: 'GxMtbXdrMtbDetectedXdrDetected',
            label: 'MTB Detected Drug Resistance Detected',
            scope: 'ResultCategoryGroups',
          },
          {
            value: 'GxMtbXdrMtbDetectedXdrNotDetected',
            label: 'MTB Detected Drug Resistance Not Detected',
            scope: 'ResultCategoryGroups',
          },
          {
            value: 'GxMtbXdrMtbDetectedXdrIndeterminate',
            label: 'MTB Detected Drug Resistance Indeterminate',
            scope: 'ResultCategoryGroups',
          },
          {
            value: 'GxMtbXdrMtbInvalid',
            label: 'MTB Invalid',
            scope: 'ResultCategoryGroups',
          },
          {
            value: 'GxMtbXdrMtbError',
            label: 'MTB Error',
            scope: 'ResultCategoryGroups',
          },
          {
            value: 'GxMtbXdrMtbNoResult',
            label: 'MTB No Result',
            scope: 'ResultCategoryGroups',
          },
          {
            value: 'GxMtbXdrMTBNotDetectedDrugResistanceNotDetected',
            label: 'MTB Not Detected Drug Resistance Not Detected',
            scope: 'ResultCategoryGroups',
          },
        ],
      ],
    },
    {
      assayId: 'GxMtbRifUltra',
      resultCategoryId: [
        {
          value: 'GxMtbRifUltraMtbNotDetected',
          label: 'MTB Not Detected',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxMtbRifUltraMtbTraceDetected',
          label: 'MTB Trace Detected',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxMtbRifUltraMtbDetected',
          label: 'MTB Detected',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxMtbRifUltraMtbDetectedRifNotDetected',
          label: 'MTB Detected - Rif Not Detected',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxMtbRifUltraMtbDetectedRifDetected',
          label: 'MTB Detected - Rif Detected',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxMtbRifUltraMtbDetectedRifIndeterminate',
          label: 'MTB Detected - Rif Indeterminate',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxMtbRifUltraMtbInvalid',
          label: 'MTB Invalid',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxMtbRifUltraMtbError',
          label: 'MTB Error',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxMtbRifUltraMtbNoResult',
          label: 'MTB No Result',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxMtbRifUltraMTBTraceDetectedRifIndeterminate',
          label: 'MTB Trace Detected Rif Indeterminate',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxMtbRifUltraMTBTraceDetectedRifNoResult',
          label: 'MTB Trace Detected Rif No Result',
          scope: 'ResultCategoryGroups',
        },
      ],
    },
    {
      assayId: 'GxMtbRif',
      resultCategoryId: [
        {
          value: 'GxMtbRifMtbNotDetected',
          label: 'MTB Not Detected',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxMtbRifMtbDetected',
          label: 'MTB Detected',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxMtbRifMtbDetectedRifDetected',
          label: 'MTB Detected RIF Detected',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxMtbRifMtbDetectedRifNotDetected',
          label: 'MTB Detected RIF Not Detected',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxMtbRifMtbDetectedRifIndeterminate',
          label: 'MTB Detected RIF Indeterminate',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxMtbRifMtbInvalid',
          label: 'MTB Invalid',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxMtbRifMtbError',
          label: 'MTB Error',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxMtbRifMtbNoResult',
          label: 'MTB No Result',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxMtbRifMTBErrorRifError',
          label: 'MTB Error Rif Error',
          scope: 'ResultCategoryGroups',
        },
      ],
    },
    {
      assayId: 'GxHiv1Vl',
      resultCategoryId: [
        {
          value: 'GxHiv1VlMoreThan1000',
          label: 'HIV >= 1000 cp/mL',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxHiv1VlLessThan1000',
          label: 'HIV < 1000 cp/mL',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxHiv1VlLessThan40',
          label: 'HIV < 40 cp/mL',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxHiv1VlError',
          label: 'HIV Error',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxHiv1VlNoResult',
          label: 'HIV No Result',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxHiv1VlInvalid',
          label: 'HIV Invalid',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxHiv1VlNotDetected',
          label: 'HIV Not Detected',
          scope: 'ResultCategoryGroups',
        },
      ],
    },
    {
      assayId: 'GxHiv1Qual',
      resultCategoryId: [
        {
          value: 'GxHiv1QualError',
          label: 'HIV Error',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxHiv1QualNoResult',
          label: 'HIV No Result',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxHiv1QualInvalid',
          label: 'HIV Invalid',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxHiv1QualNotDetected',
          label: 'HIV Not Detected',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxHiv1QualDetected',
          label: 'HIV Detected',
          scope: 'ResultCategoryGroups',
        },
      ],
    },
    {
      assayId: 'GxHcv',
      resultCategoryId: [
        {
          value: 'GxHcvDetected',
          label: 'HCV Detected',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxHcvNotDetected',
          label: 'HCV Not Detected',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxHcvInvalid',
          label: 'HCV Invalid',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxHcvNoResult',
          label: 'HCV No Result',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxHcvError',
          label: 'HCV Error',
          scope: 'ResultCategoryGroups',
        },
      ],
    },
    {
      assayId: 'GxEbola',
      resultCategoryId: [
        {
          value: 'GxEbolaGPDetectedNPDetected',
          label: 'GP Detected - NP Detected',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxEbolaGPDetected',
          label: 'GP Detected',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxEbolaNPDetected',
          label: 'NP Detected',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxEbolaGPNotDetectedNPNotDetected',
          label: 'GP Not Detected - NP Not Detected',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxEbolaGPNotDetectedNPDetected',
          label: 'GP Not Detected - NP Detected',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxEbolaGPDetectedNPNotDetected',
          label: 'GP Detected - NP Not Detected',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxEbolaGPInvalid',
          label: 'GP Invalid',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxEbolaGPError',
          label: 'Error',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'GxEbolaGPNoResult',
          label: 'GP No Result',
          scope: 'ResultCategoryGroups',
        },
      ],
    },
    {
      assayId: 'assayGXCovid19',
      resultCategoryId: [
        {
          value: 'assayGXCovid19PresumptivePositive',
          label: 'COVID-19 Presumptive Positive',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'assayGXCovid19Positive',
          label: 'COVID-19 Positive',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'assayGXCovid19Inconclusive',
          label: 'COVID-19 Inconclusive',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'assayGXCovid19Negative',
          label: 'COVID-19 Negative',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'assayGXCovid19Unknown',
          label: 'COVID-19 Unknown',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'assayGXCovid19Error',
          label: 'COVID-19 Error',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'assayGXCovid19NoResult',
          label: 'COVID-19 No Result',
          scope: 'ResultCategoryGroups',
        },
        {
          value: 'assayGXCovid19Invalid',
          label: 'COVID-19 Invalid',
          scope: 'ResultCategoryGroups',
        },
      ],
    },
  ]

  // NotificationType
  let { id: notificationTypeId } =
    (await knex('NotificationType as t').where('t.name', 'Send Test Results to C360').first('t.id')) || {}
  if (!notificationTypeId) {
    const issueBasedNotificationTypeCategoryId = await notificationTypeCategoryToId('resultBased')
    const notificationType = {
      notificationTypeCategoryId: issueBasedNotificationTypeCategoryId,
      partnerId,
      filterCondition: JSON.stringify({
        sendSms: false,
        sendWeb: true,
        sendEmail: false,
        resultBasedScope: 'created',
        result: [
          {
            assayId: 'GxMtbXdr',
            resultCategoryId: [
              [
                {
                  value: 'GxMtbXdrMtbNotDetected',
                  label: 'MTB Not Detected',
                  scope: 'ResultCategoryGroups',
                },
                {
                  value: 'GxMtbXdrMtbDetected',
                  label: 'MTB Detected',
                  scope: 'ResultCategoryGroups',
                },
                {
                  value: 'GxMtbXdrMtbDetectedXdrDetected',
                  label: 'MTB Detected Drug Resistance Detected',
                  scope: 'ResultCategoryGroups',
                },
                {
                  value: 'GxMtbXdrMtbDetectedXdrNotDetected',
                  label: 'MTB Detected Drug Resistance Not Detected',
                  scope: 'ResultCategoryGroups',
                },
                {
                  value: 'GxMtbXdrMtbDetectedXdrIndeterminate',
                  label: 'MTB Detected Drug Resistance Indeterminate',
                  scope: 'ResultCategoryGroups',
                },
                {
                  value: 'GxMtbXdrMtbInvalid',
                  label: 'MTB Invalid',
                  scope: 'ResultCategoryGroups',
                },
                {
                  value: 'GxMtbXdrMtbError',
                  label: 'MTB Error',
                  scope: 'ResultCategoryGroups',
                },
                {
                  value: 'GxMtbXdrMtbNoResult',
                  label: 'MTB No Result',
                  scope: 'ResultCategoryGroups',
                },
                {
                  value: 'GxMtbXdrMTBNotDetectedDrugResistanceNotDetected',
                  label: 'MTB Not Detected Drug Resistance Not Detected',
                  scope: 'ResultCategoryGroups',
                },
              ],
            ],
          },
          {
            assayId: 'GxMtbRifUltra',
            resultCategoryId: [
              {
                value: 'GxMtbRifUltraMtbNotDetected',
                label: 'MTB Not Detected',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxMtbRifUltraMtbTraceDetected',
                label: 'MTB Trace Detected',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxMtbRifUltraMtbDetected',
                label: 'MTB Detected',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxMtbRifUltraMtbDetectedRifNotDetected',
                label: 'MTB Detected - Rif Not Detected',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxMtbRifUltraMtbDetectedRifDetected',
                label: 'MTB Detected - Rif Detected',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxMtbRifUltraMtbDetectedRifIndeterminate',
                label: 'MTB Detected - Rif Indeterminate',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxMtbRifUltraMtbInvalid',
                label: 'MTB Invalid',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxMtbRifUltraMtbError',
                label: 'MTB Error',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxMtbRifUltraMtbNoResult',
                label: 'MTB No Result',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxMtbRifUltraMTBTraceDetectedRifIndeterminate',
                label: 'MTB Trace Detected Rif Indeterminate',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxMtbRifUltraMTBTraceDetectedRifNoResult',
                label: 'MTB Trace Detected Rif No Result',
                scope: 'ResultCategoryGroups',
              },
            ],
          },
          {
            assayId: 'GxMtbRif',
            resultCategoryId: [
              {
                value: 'GxMtbRifMtbNotDetected',
                label: 'MTB Not Detected',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxMtbRifMtbDetected',
                label: 'MTB Detected',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxMtbRifMtbDetectedRifDetected',
                label: 'MTB Detected RIF Detected',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxMtbRifMtbDetectedRifNotDetected',
                label: 'MTB Detected RIF Not Detected',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxMtbRifMtbDetectedRifIndeterminate',
                label: 'MTB Detected RIF Indeterminate',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxMtbRifMtbInvalid',
                label: 'MTB Invalid',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxMtbRifMtbError',
                label: 'MTB Error',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxMtbRifMtbNoResult',
                label: 'MTB No Result',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxMtbRifMTBErrorRifError',
                label: 'MTB Error Rif Error',
                scope: 'ResultCategoryGroups',
              },
            ],
          },
          {
            assayId: 'GxHiv1Vl',
            resultCategoryId: [
              {
                value: 'GxHiv1VlMoreThan1000',
                label: 'HIV >= 1000 cp/mL',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxHiv1VlLessThan1000',
                label: 'HIV < 1000 cp/mL',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxHiv1VlLessThan40',
                label: 'HIV < 40 cp/mL',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxHiv1VlError',
                label: 'HIV Error',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxHiv1VlNoResult',
                label: 'HIV No Result',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxHiv1VlInvalid',
                label: 'HIV Invalid',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxHiv1VlNotDetected',
                label: 'HIV Not Detected',
                scope: 'ResultCategoryGroups',
              },
            ],
          },
          {
            assayId: 'GxHiv1Qual',
            resultCategoryId: [
              {
                value: 'GxHiv1QualError',
                label: 'HIV Error',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxHiv1QualNoResult',
                label: 'HIV No Result',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxHiv1QualInvalid',
                label: 'HIV Invalid',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxHiv1QualNotDetected',
                label: 'HIV Not Detected',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxHiv1QualDetected',
                label: 'HIV Detected',
                scope: 'ResultCategoryGroups',
              },
            ],
          },
          {
            assayId: 'GxHcv',
            resultCategoryId: [
              {
                value: 'GxHcvDetected',
                label: 'HCV Detected',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxHcvNotDetected',
                label: 'HCV Not Detected',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxHcvInvalid',
                label: 'HCV Invalid',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxHcvNoResult',
                label: 'HCV No Result',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxHcvError',
                label: 'HCV Error',
                scope: 'ResultCategoryGroups',
              },
            ],
          },
          {
            assayId: 'GxEbola',
            resultCategoryId: [
              {
                value: 'GxEbolaGPDetectedNPDetected',
                label: 'GP Detected - NP Detected',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxEbolaGPDetected',
                label: 'GP Detected',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxEbolaNPDetected',
                label: 'NP Detected',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxEbolaGPNotDetectedNPNotDetected',
                label: 'GP Not Detected - NP Not Detected',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxEbolaGPNotDetectedNPDetected',
                label: 'GP Not Detected - NP Detected',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxEbolaGPDetectedNPNotDetected',
                label: 'GP Detected - NP Not Detected',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxEbolaGPInvalid',
                label: 'GP Invalid',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxEbolaGPError',
                label: 'Error',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'GxEbolaGPNoResult',
                label: 'GP No Result',
                scope: 'ResultCategoryGroups',
              },
            ],
          },
          {
            assayId: 'assayGXCovid19',
            resultCategoryId: [
              {
                value: 'assayGXCovid19PresumptivePositive',
                label: 'COVID-19 Presumptive Positive',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'assayGXCovid19Positive',
                label: 'COVID-19 Positive',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'assayGXCovid19Inconclusive',
                label: 'COVID-19 Inconclusive',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'assayGXCovid19Negative',
                label: 'COVID-19 Negative',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'assayGXCovid19Unknown',
                label: 'COVID-19 Unknown',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'assayGXCovid19Error',
                label: 'COVID-19 Error',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'assayGXCovid19NoResult',
                label: 'COVID-19 No Result',
                scope: 'ResultCategoryGroups',
              },
              {
                value: 'assayGXCovid19Invalid',
                label: 'COVID-19 Invalid',
                scope: 'ResultCategoryGroups',
              },
            ],
          },
        ],
      }),
      level: 1,
      canAcknowledge: false,
      messageTypeId,
      name: 'Send Test Results to C360',
      sendToContactsWithMatchingTags: false,
      enabled: true,
      ...auditFields,
    }
    ;[notificationTypeId] = await knex('NotificationType').insert(notificationType)
  }
}, __filename)
