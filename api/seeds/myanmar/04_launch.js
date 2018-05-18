module.exports = require('../../src/db').seed(seed)

async function seed(knex) {
  // change issue/notification types from "Generic" to "Procedural"
  await knex('NotificationType').update({
    name: knex.raw("replace(name, 'Generic', 'Procedural')"),
  })

  await knex('IssueType').update({
    name: knex.raw("replace(name, 'Generic', 'Procedural')"),
  })

  await knex('AlertTemplate').update({
    message: knex.raw("replace(message, 'Generic', 'Procedural')"),
  })

  await knex('EmailTemplate').update({
    subject: knex.raw("replace(subject, 'Generic', 'Procedural')"),
    body: knex.raw("replace(body, 'Generic', 'Procedural')"),
    htmlBody: knex.raw("replace(htmlBody, 'Generic', 'Procedural')"),
  })

  await knex('SmsTemplate').update({
    message: knex.raw("replace(message, 'Generic', 'Procedural')"),
  })
}
