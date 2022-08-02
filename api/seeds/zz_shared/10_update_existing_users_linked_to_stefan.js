module.exports = require('../utils').seed(async knex => {
  await knex('Person').where('email', 'stefan@systemone.id').update({ email: 'developer@systemone.id' })
  await knex('Person').where('email', 'stefan@systemone.co').update({ email: 'developer@systemone.co' })
  await knex('Person').where('email', 'sbaumgartner@systemone.id').update({ email: 'developer@systemone.id' })
  await knex('Person').where('email', 'sbaumgartner@systemone.co').update({ email: 'developer@systemone.co' })

  await knex('Person').where('email2', 'stefan@systemone.id').update({ email2: 'developer@systemone.id' })
  await knex('Person').where('email2', 'stefan@systemone.co').update({ email2: 'developer@systemone.co' })
  await knex('Person').where('email2', 'sbaumgartner@systemone.id').update({ email2: 'developer@systemone.id' })
  await knex('Person').where('email2', 'sbaumgartner@systemone.co').update({ email2: 'developer@systemone.co' })

  await knex('Person').whereIn('phone', ['+1 413 548 5003', '+14135485003']).update({ phone: '+1 888 8452610' })

  await knex('Person').whereIn('cell', ['+1 413 548 5003', '+14135485003']).update({ cell: '+1 888 8452610' })

  await knex('SmsTemplate')
    .whereIn('phoneNumber', ['+1 413 548 5003', '+14135485003'])
    .update({ phoneNumber: '+1 888 8452610' })

  const { id: pendingMessageStatusId } = await knex('MessageStatus').where('externalId', 'Pending').first('id')
  await knex('SmsMessage')
    .whereIn('phoneNumber', ['+1 413 548 5003', '+14135485003'])
    .andWhere('messageStatusId', pendingMessageStatusId)
    .update({ phoneNumber: '+1 888 8452610' })

  await knex('User').where('name', 'sbaumgartner').update({ name: 'developer' })
  await knex('User').where('name', 'stefan@systemone.id').update({ name: 'developer@systemone.id' })
  await knex('User').where('name', 'stefan@systemone.co').update({ name: 'developer@systemone.co' })
  await knex('User').where('name', 'sbaumgartner@systemone.id').update({ name: 'developer@systemone.id' })
  await knex('User').where('name', 'sbaumgartner@systemone.co').update({ name: 'developer@systemone.co' })
}, __filename)
