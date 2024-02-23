module.exports = require('../utils').seed(seed, __filename)

const { upsertDashboardWidgets } = require('../common')
const {
  partner: { externalId: partnerExternalId },
} = require('./fixtures/partnerData')
const dashboardWidgets = require('./fixtures/dashboardWidget')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner').where({ externalId: partnerExternalId }).first('id')

  await upsertDashboardWidgets(knex, partnerId, dashboardWidgets, [
    'gxPositiveResultsNotified',
    'averageRecipientsOfEmail',
    'averageRecipientsOfSms',
  ])
}
