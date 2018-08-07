module.exports = require('../../src/db').seed(seed)

async function seed(knex) {
  const dateFormatUpdated = await knex('Person')
    .whereNotNull('dateFormat')
    .first()
  if (dateFormatUpdated != null) {
    return
  }

  await knex('Person').update({ dateFormat: 'D/M/YYYY' })

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
