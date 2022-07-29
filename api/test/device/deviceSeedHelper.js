const { knex } = require('../../src/db')
const { DataTracker } = require('./DataTracker')

class DeviceSeedHelper {
  constructor(dataTracker = new DataTracker()) {
    this.dataTracker = dataTracker
  }

  async seedDevice(deviceData = {}, options = {}) {
    const deviceId = await seedDevice(deviceData, options)
    this.dataTracker.trackData('Device', [deviceId])
    console.log('\x1b[1;36m', '🚀 ➜ file: deviceSeedHelper.js ➜ line 13 ➜ this.dataTracker', this.dataTracker)
    return deviceId
  }
}

async function seedDevice(deviceData = {}) {
  const { adminId } = await knex('User').where({ id: 1 }).first('id as adminId')
  const { deviceTypeId } = await knex('DeviceType')
    .where({ externalId: 'CepheidGeneXpert' })
    .first('id as deviceTypeId')
  const { partnerId } = await knex('Partner').where({ name: 'Partner One' }).first('id as partnerId')
  const { deviceApprovalApprovedId } = await knex('DeviceApproval')
    .where({ name: 'Approved' })
    .first('id as deviceApprovalApprovedId')
  const testSite = knex('Site').where({ externalId: 'Ohio_Wayne' }).first()
  const now = new Date()
  const millisInHour = 1000 * 60 * 60

  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const randomString = getRandomString(10)

  const i = Math.floor(Math.random() * 100)
  
  const deviceParams = {
    ...auditFields,
    name: `Test Device ${randomString}`,
    shortName: `Test Device ${randomString}`,
    deviceTypeId,
    deviceApprovalId: deviceApprovalApprovedId,
    configurationData: JSON.stringify({
      requirePrinter: 'yes',
      adminPassword: 'pwd123',
      firmwareUpdateRequired: 'no',
    }),
    partnerId,
    geographyId: testSite.geographyId,
    siteId: testSite.id,
    // defaultReportableSiteId: siteDatas[i + 1] ? siteDatas[i + 1].id : null,
    // deviceId: i === 0 ? routerId : null,
    createdOn: new Date(+now - 3 * i * millisInHour),
    updatedOn: new Date(+now - i * millisInHour),
    lastPingOn: new Date(+now - (i * millisInHour) / 3),
    lastSeenOn: new Date(+now - (i * millisInHour) / 3),
    hostId: randomString,
    serial: randomString,
    ...deviceData,
  }

  const [deviceId] = await knex('Device').insert(deviceParams)

  return deviceId
}

getRandomString = length => Buffer.from(Math.random().toString()).toString('base64').substring(10, length)

module.exports = {
  DeviceSeedHelper,
}
