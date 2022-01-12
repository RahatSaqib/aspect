module.exports = require('../utils').seed(seed, __filename)
const { addMinutes } = require('date-fns')
const bcrypt = require('bcrypt')
const { promisify } = require('util')
const Promise = require('bluebird')
const { upsertTruenatDeviceTypeAndAssays } = require('../commonTruenat')
const {
  partnerName,
  adminUserName,
  partnerAbbreviation,
} = require('./fixtures/partnerData')
const truenatDevices = require('./fixtures/truenatDevices.json')
const {
  deviceTypeToId,
  deviceApprovalToId,
} = require('../../src/shared/dictionary')
const { randomToken } = require('../../src/deviceApi/apiKey')
const { passwordSaltRounds } = require('../../src/config')

const bcryptHash = promisify(bcrypt.hash)

async function seed(knex) {
  await upsertTruenatDeviceTypeAndAssays(knex)
  // Initial Test Truenat Device
  const now = new Date()
  const { id: partnerId } = await knex('Partner')
    .where('name', partnerName)
    .first('id')
  const { id: adminId } = await knex('User')
    .where('name', adminUserName)
    .first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  await Promise.each(truenatDevices, async truenatDevice => {
    const { id: geographyId } = await knex('Country as c')
      .join('Geography as g', 'c.id', 'g.countryId')
      .join('State as s', 'g.stateId', 's.id')
      .join('Lga as l', 'g.lgaId', 'l.id')
      .where('c.abbreviation', partnerAbbreviation)
      .andWhere('s.name', truenatDevice.stateName)
      .andWhere('l.name', truenatDevice.lgaName)
      .first('g.id')

    let ntrlSite = await knex('Site')
      .where('externalId', truenatDevice.siteExternalId)
      .andWhere('partnerId', partnerId)
      .andWhere('geographyId', geographyId)
      .first()
    if (!ntrlSite) {
      const [ntrlSiteId] = await knex('Site').insert({
        ...auditFields,
        name: truenatDevice.siteName,
        shortName: truenatDevice.siteShortName,
        externalId: truenatDevice.siteExternalId,
        partnerId,
        geographyId,
        createdOn: new Date(),
        updatedOn: new Date(),
      })
      ntrlSite = await knex('Site').where('id', ntrlSiteId).first()
    }
    const truenatDeviceTypeId = await deviceTypeToId('molbioTruenat')
    const deviceApprovalApprovedId = await deviceApprovalToId('approved')
    let ntrlTruenatDevice = await knex('Device')
      .where('siteId', ntrlSite.id)
      .andWhere('deviceTypeId', truenatDeviceTypeId)
      .first()
    if (!ntrlTruenatDevice) {
      const [ntrlTruenatDeviceId] = await knex('Device').insert({
        ...auditFields,
        name: truenatDevice.deviceName,
        shortName: truenatDevice.deviceShortName,
        deviceTypeId: truenatDeviceTypeId,
        deviceApprovalId: deviceApprovalApprovedId,
        partnerId,
        geographyId,
        siteId: ntrlSite.id,
        defaultReportableSiteId: ntrlSite.id,
        createdOn: new Date(),
        updatedOn: new Date(),
        lastPingOn: new Date(),
        lastSeenOn: new Date(),
      })
      ntrlTruenatDevice = await knex('Device')
        .where('id', ntrlTruenatDeviceId)
        .first()
      if (ntrlTruenatDevice.deviceApprovalId !== deviceApprovalApprovedId) {
        await knex('Device').where('id', ntrlTruenatDeviceId).update({
          deviceApprovalId: deviceApprovalApprovedId,
          updatedOn: new Date(),
        })
      }
    }
    const ntrlTruenatDeviceApiKey = await knex('DeviceApiKey')
      .where('deviceId', ntrlTruenatDevice.id)
      .whereNotNull('username')
      .whereNotNull('password')
      .andWhere('revoked', 0)
      .first()
    if (!ntrlTruenatDeviceApiKey) {
      const password = await bcryptHash(
        truenatDevice.password,
        parseInt(passwordSaltRounds, 10)
      )
      await knex('DeviceApiKey').insert({
        token: randomToken(),
        revoked: 0,
        partnerId,
        geographyId,
        siteId: ntrlSite.id,
        deviceId: ntrlTruenatDevice.id,
        username: truenatDevice.username,
        password,
        expiresOn: addMinutes(new Date(), 15),
        ...auditFields,
      })
    }
  })
}
