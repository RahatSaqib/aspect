const _ = require('lodash')

const { seedCheckTbAppWebHook } = require('../utils_cameroon')
const config = require('../../src/config')

module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const checkTbAppUrl = _.get(config, 'webhook.checktbapp.url')
  const checkTbAppAuthKey = _.get(config, 'webhook.checktbapp.authKey')
  if (!checkTbAppUrl || !checkTbAppAuthKey) {
    // eslint-disable-next-line no-console
    console.error(
      'Missing Check TB App webhook environment variables. Ensure that webhook.checktbapp.url and webhook.checktbapp.authKey are set in .env'
    )
    process.exit(1)
  }

  const now = new Date()

  const { id: adminId } = await knex('User')
    .where({ name: 'admin' })
    .first('id')

  const { id: partnerId } = await knex('Partner')
    .where({ name: 'Cameroon' })
    .first('id')

  await knex('Partner')
    .where('id', partnerId)
    .update({ plugin: 'cameroon' })

  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  await seedCheckTbAppWebHook(knex, { partnerId, auditFields })
}
