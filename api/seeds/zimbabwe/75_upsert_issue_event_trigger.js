const { partnerName, adminUserName } = require('./fixtures/partnerData')
const upsertIssueEventTrigger = require('../common/upsert_issue_event_triggers')
const { addIssueTypes } = require('../relativeObjectsSeeds')

module.exports = require('../utils').seed(async knex => {
  const { partnerId, adminId } = await knex('Partner as p')
    .join('Person as per', 'per.lastPartnerId', 'p.id')
    .join('User as u', 'u.id', 'per.userId')
    .where({ 'p.name': partnerName, 'u.name': adminUserName })
    .first('p.id as partnerId', 'per.userId as adminId')
  await addIssueTypes(knex, partnerId, adminId, ['HardwareTemperatureErrors'])
  await upsertIssueEventTrigger(knex, partnerName)
}, __filename)
