const { adminName } = require('./fixtures/partnerData')
const { upsertGxAlertDevice } = require('../common')

module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const { id: countryId } = await knex('Country').where('abbreviation', 'NG').first('id')
  const { id: partnerId } = await knex('Partner').where('name', 'Partner One').first()
  const { id: adminId } = await knex('User').where('name', adminName).first('id')
  const now = new Date()
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  await upsertGxAlertDevice(knex, countryId, partnerId, auditFields, 'hlswabb9dwqq1ynla67s')
}
