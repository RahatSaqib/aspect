const { upsertDashboardWidgets } = require('../common')
const { getPartnerByName } = require('../utils')

module.exports = async (knex, partnerName, fixture) => {
    await upsertDashboardWidgets(knex, await getPartnerByName(knex, partnerName), fixture, ['personTitle'])
}