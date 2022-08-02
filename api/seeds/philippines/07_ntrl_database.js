module.exports = require('../utils').seed(seed, __filename)

const { getPartnerByName } = require('../utils')
const { deviceApprovalToId } = require('../../src/shared/dictionary')

async function seed(knex) {
  const { id: partnerId } = await getPartnerByName(knex, 'Philippines')
  const ntrlSite = await knex('Site')
    .where({
      shortName: 'NTRL',
      partnerId,
    })
    .first()

  const { id: deviceTypeId } = await knex('DeviceType').where('externalId', 'PhilippinesNtrl').first('id')

  let { id: ntrlDatabaseDeviceId } =
    (await knex('Device')
      .where({
        deviceTypeId,
        partnerId,
        siteId: ntrlSite.id,
      })
      .first('id')) || {}

  if (ntrlDatabaseDeviceId) return

  const now = new Date()
  const { id: adminId } = await knex('User').where({ name: 'admin' }).first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  ;[ntrlDatabaseDeviceId] = await knex('Device').insert({
    ...auditFields,
    name: 'NTRL Database',
    shortName: 'NTRL Database',
    serial: 'NTRL-DB-SERVER',
    hostId: 'NTRL-DB-SERVER',
    macAddress: '1c:69:7a:01:eb:9c,50:76:af:9f:e1:56',
    deviceApprovalId: await deviceApprovalToId('approved'),
    partnerId,
    geographyId: ntrlSite.geographyId,
    siteId: ntrlSite.id,
    lastPingOn: new Date(),
    lastSeenOn: new Date(),
    deviceTypeId,
    culture: 'en',
    timezone: 'Taipei Standard Time',
    configurationData: '{}',
  })

  const deviceApiKey = {
    token: 'datq7eg05nvh1a6bb2dg',
    revoked: 0,
    partnerId,
    geographyId: ntrlSite.geographyId,
    deviceId: ntrlDatabaseDeviceId,
  }
  await knex('DeviceApiKey').insert({
    ...deviceApiKey,
    ...auditFields,
  })
}
