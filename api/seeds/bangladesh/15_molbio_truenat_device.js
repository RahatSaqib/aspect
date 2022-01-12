module.exports = require('../utils').seed(seed, __filename)
const { addMinutes } = require('date-fns')
const bcrypt = require('bcrypt')
const { promisify } = require('util')
const { upsertTruenatDeviceTypeAndAssays } = require('../commonTruenat')
const {
  partnerName,
  adminUserName,
  partnerAbbreviation,
} = require('./fixtures/partnerData')
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
  const { id: geographyId } = await knex('Country as c')
    .join('Geography as g', 'c.id', 'g.countryId')
    .join('State as s', 'g.stateId', 's.id')
    .join('Lga as l', 'g.lgaId', 'l.id')
    .where('c.abbreviation', partnerAbbreviation)
    .andWhere('s.name', 'Dhaka Division')
    .andWhere('l.name', 'Dhaka District')
    .first('g.id')

  let ntrlSite = await knex('Site')
    .where('externalId', 'NTRL')
    .andWhere('partnerId', partnerId)
    .andWhere('geographyId', geographyId)
    .first()
  if (!ntrlSite) {
    const [ntrlSiteId] = await knex('Site').insert({
      ...auditFields,
      name: 'NTRL',
      shortName: 'NTRL',
      externalId: 'NTRL',
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
      name: 'NTRL Truenat',
      shortName: 'NTRL Truenat',
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
      'G9DK8vyR',
      parseInt(passwordSaltRounds, 10)
    )
    await knex('DeviceApiKey').insert({
      token: randomToken(),
      revoked: 0,
      partnerId,
      deviceId: ntrlTruenatDevice.id,
      username: 'ntrltruenat1',
      password,
      expiresOn: addMinutes(new Date(), 15),
      ...auditFields,
    })
  }
}
