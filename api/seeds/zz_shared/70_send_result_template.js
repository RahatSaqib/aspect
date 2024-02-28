const { seed } = require('../utils')

const sendResultTemplate = require('../common/send_result_template')
const upsertWebHookTemplates = require('../common/upsert_webhook_templates')

// eslint-disable-next-line import/no-dynamic-require
const partnerData = require(`../${process.env['seeds.directory'].replace('./seeds/', '')}/fixtures/partnerData`)

module.exports = seed(async knex => {
  const { adminUserName } = partnerData

  const { id: userId } = await knex('User').where({ name: adminUserName }).first('id')
  await upsertWebHookTemplates(knex, [sendResultTemplate], userId)
}, __filename)
