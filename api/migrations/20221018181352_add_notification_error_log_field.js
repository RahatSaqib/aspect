exports.up = async function (knex) {
  await knex.schema.alterTable('SmsMessage', smsMessage => {
    smsMessage.json('errorData').nullable()
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('SmsMessage', smsMessage => {
    smsMessage.dropColumn('errorData')
  })
}
