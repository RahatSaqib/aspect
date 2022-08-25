module.exports = require('../utils').seed(seed, __filename)

const { getPartnerByName, seedIssueEscalationTriggersForPartner } = require('../utils')

const { partnerName } = require('./fixtures/partnerData')

async function seed(knex) {
  const { id: partnerId } = await getPartnerByName(knex, partnerName)

  // use escalation triggers to notify about new MTB+ Rif- and MTB+ Rif+ results:
  await seedIssueEscalationTriggersForPartner(knex, partnerId, [
    'ResultCategory1DetectedResultCategory2NotDetected',
    'ResultCategory1DetectedResultCategory2Detected',
  ])
}
