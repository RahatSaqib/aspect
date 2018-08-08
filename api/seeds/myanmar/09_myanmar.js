module.exports = require('../../src/db').seed(seed)

async function seed(knex) {
  const displayPreferencesUpdated = await knex('Partner')
    .whereNotNull('displayPreferences')
    .first()
  if (displayPreferencesUpdated != null) {
    return
  }

  await knex('Partner')
    .where({ name: 'Myanmar' })
    .update({
      displayPreferences: JSON.stringify({
        dateFormat: 'D/M/YYYY',
        timeFormat: 'HH:mm:ss',
        dateTimeFormat: 'D/M/YYYY HH:mm:ss',
      }),
    })

  await knex('AlertTemplate')
    .where({
      message: 'Stock-out expected {{issue.data.date}} - Order Stock.',
    })
    .update({
      message:
        'Stock-out expected {{formatDate issue.data.date}} - Order Stock.',
    })

  await knex('SmsTemplate')
    .where({
      message: 'Stock-out expected {{issue.data.date}} - Order Stock.',
    })
    .update({
      message:
        'Stock-out expected {{formatDate issue.data.date}} - Order Stock.',
    })

  await knex('EmailTemplate')
    .where({
      body: 'Stock-out expected {{issue.data.date}} - Order Stock.',
    })
    .update({
      body: 'Stock-out expected {{formatDate issue.data.date}} - Order Stock.',
      htmlBody:
        '<em>{{site.name}}:</em> Stock-out expected {{formatDate issue.data.date}} - Order Stock.',
    })
}
