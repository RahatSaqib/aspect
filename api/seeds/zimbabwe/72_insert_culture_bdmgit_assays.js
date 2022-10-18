const { upsertCultureAssays } = require('../commonTB')
const { allDeviceTypeCategoryToId } = require('../../src/shared/dictionary')
const upsertMGITDevices = require('./fixtures/insert_bdmgit_assay_and_devices')

module.exports = require('../utils').seed(async knex => {
  const { 'Information System': deviceTypeCategoryInformationSystem } = await allDeviceTypeCategoryToId()
  let { id: deviceTypeSenaiteLimsId } = (await knex('DeviceType').where('externalId', 'SenaiteLims').first('id')) || {}
  if (!deviceTypeSenaiteLimsId) {
    ;[deviceTypeSenaiteLimsId] = await knex('DeviceType').insert({
      externalId: 'SenaiteLims',
      name: 'Senaite LIMS',
      manufacturer: 'Senaite',
      deviceTypeCategoryId: deviceTypeCategoryInformationSystem,
    })
  }
  await upsertCultureAssays(knex, deviceTypeSenaiteLimsId)
  await upsertMGITDevices(knex)
}, __filename)
