const { upsertTruenatDeviceTypeAndAssays } = require('../commonTruenat')
const { createDevicesForAllMissingTypes } = require('../commonGenerateResults')
const {
  partner: { externalId: partnerExternalId },
  adminUserName,
} = require('./fixtures/partnerData')

module.exports = require('../utils').seed(async knex => {
  await upsertTruenatDeviceTypeAndAssays(knex)
  const { id: partnerId } = await knex('Partner').where('externalId', partnerExternalId).first('id')

  const { id: userId } = await knex('User').where('name', adminUserName).first('id')

  const siteDatas = await knex('Site').where('partnerId', partnerId).select()

  const now = new Date()
  const auditFields = {
    createdOn: now,
    createdBy: userId,
    updatedOn: now,
    updatedBy: userId,
  }

  await createDevicesForAllMissingTypes(knex, siteDatas, partnerId, auditFields, 1, ['molbioTruenat'])
}, __filename)
