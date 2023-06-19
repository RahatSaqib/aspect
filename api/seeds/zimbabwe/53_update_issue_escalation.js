module.exports = require('../utils').seed(seed, __filename)

const { getPartnerByExternalId, seedIssueEscalationTriggersForPartner } = require('../utils')

const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')

async function seed(knex) {
  const { id: partnerId } = await getPartnerByExternalId(knex, partnerExternalId)

  // use escalation triggers to notify about new MTB+ Rif- and MTB+ Rif+ results:
  await seedIssueEscalationTriggersForPartner(knex, partnerId, [
    'ResultCategory1DetectedResultCategory2NotDetected',
    'ResultCategory1DetectedResultCategory2Detected',
  ])
}
