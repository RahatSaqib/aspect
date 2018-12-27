module.exports = require('../utils').seed(seed)

const _ = require('lodash')
const Promise = require('bluebird')

const config = require('../../src/config')

async function seed(knex) {
  const redCAPWebhookTemplate = await knex('WebhookTemplate')
    .where('externalId', 'redCapAlereQHiv12Detect')
    .first()

  const resultForms = await knex('ResultForm')
    .select()
    .map(resultForm =>
      Object.assign({}, resultForm, {
        formSchema: JSON.parse(resultForm.formSchema),
      })
    )

  const sampleTypeValuesNotNumeric = !_.every(resultForms, resultForm =>
    _.every(resultForm.formSchema.fields.sampleType.control.options, option =>
      Number.isNaN(parseFloat(option.value))
    )
  )
  if (!redCAPWebhookTemplate && !sampleTypeValuesNotNumeric) {
    return
  }

  if (redCAPWebhookTemplate) {
    await knex('WebhookTemplate')
      .where('id', redCAPWebhookTemplate.id)
      .update({ externalId: 'redCapAlereQ' })
  }

  if (sampleTypeValuesNotNumeric) {
    await Promise.map(
      resultForms,
      resultForm => {
        resultForm.formSchema.fields.sampleType.control.options = [
          {
            value: '1',
            i18nText: 'studyOfSampleType',
          },
          {
            value: '2',
            i18nText: 'EQAOfSampleType',
          },
          {
            value: '3',
            i18nText: 'miscOfSampleType',
          },
        ]
        return knex('ResultForm')
          .where(_.pick(resultForm, ['partnerId', 'assayId']))
          .update({ formSchema: JSON.stringify(resultForm.formSchema) })
      },
      { concurrency: config.db.connectionLimit }
    )
  }
}
