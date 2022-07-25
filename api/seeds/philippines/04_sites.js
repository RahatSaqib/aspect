module.exports = require('../utils').seed(seed, __filename, {
  seedsFolder: 'philippines',
  staticDataFiles: ['AssayType'],
})
const _ = require('lodash')
const Promise = require('bluebird')

const sites = require('./fixtures/sites.json')
const { deviceTypeToId, deviceApprovalToId } = require('../../src/shared/dictionary')
const { getPartnerByName } = require('../utils')

async function seed(knex) {
  const partner = await getPartnerByName(knex, 'Philippines')
  const now = new Date()
  const { id: adminId } = await knex('User').where({ name: 'admin' }).first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  const philippinesCountry = await knex('Country as c')
    .where({ 'c.a3': 'PHL' })
    .first('c.id', 'c.culture', 'c.timezone')
  const philippinesRegions = await knex('Geography as g')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': philippinesCountry.id })
    .select('g.countryId', 's.id', 's.name')
  const philippinesDistricts = await knex('Geography as g')
    .innerJoin('Lga as l', 'l.id', 'g.lgaId')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': philippinesCountry.id })
    .select('g.countryId', 'l.id', 'l.name', 's.name as stateName')
  const provincesByName = philippinesRegions.reduce((provinceMemo, province) => {
    provinceMemo[province.name.toLowerCase()] = province
    const provinceDistricts = _.filter(philippinesDistricts, {
      stateName: province.name,
    })
    if (provinceDistricts) {
      provinceMemo[province.name.toLowerCase()].districts = provinceDistricts.reduce((districtMemo, district) => {
        districtMemo[district.name.toLowerCase()] = district
        return districtMemo
      }, {})
    }
    return provinceMemo
  }, {})

  await Promise.each(sites, async clinic => {
    const province = clinic.stateName
      ? provincesByName[clinic.stateName.toLowerCase()] || {
          id: null,
          districts: {},
        }
      : {
          id: null,
          districts: {},
        }
    const district =
      province.districts && clinic.lgaName
        ? province.districts[clinic.lgaName.toLowerCase()] || {
            id: null,
          }
        : {
            id: null,
          }
    const { id: siteGeographyId } = await knex('Geography')
      .where({
        countryId: philippinesCountry.id,
        stateId: province.id,
        lgaId: district.id,
      })
      .first()

    // sites
    const siteData = {
      partnerId: partner.id,
      geographyId: siteGeographyId,
      name: clinic.name,
      shortName: clinic.shortName,
      externalId: clinic.externalId,
      latitude: clinic.latitude,
      longitude: clinic.longitude,
      timezoneId: philippinesCountry.timezone,
      ...auditFields,
    }
    const existingSite = await knex('Site')
      .where('externalId', clinic.externalId)
      .orWhere('name', clinic.name)
      .first('id')
    let siteId = 0
    if (existingSite) {
      siteId = existingSite.id
    } else {
      ;[siteId] = await knex('Site').insert(siteData)
    }
    siteData.id = siteId

    if (clinic.devices) {
      await Promise.all(
        _.map(clinic.devices, async device => {
          const existingDevice = await knex('Device')
            .where({ partnerId: partner.id, serial: device.serial })
            .first(
              'id',
              'geographyId',
              'siteId',
              'deviceTypeId',
              'name',
              'shortName',
              'macAddress',
              'hostId',
              'timezone',
              'configurationData'
            )
          const deviceTypeId = await deviceTypeToId(device.deviceType)
          if (!existingDevice) {
            await knex('Device').insert({
              partnerId: partner.id,
              geographyId: siteGeographyId,
              siteId,
              deviceTypeId,
              deviceApprovalId: await deviceApprovalToId('approved'),
              name: device.name,
              shortName: device.shortName,
              serial: device.serial,
              macAddress: device.macAddress,
              hostId: device.hostId,
              culture: philippinesCountry.culture,
              timezone: siteData.timezoneId,
              configurationData: device.gxAlertDeviceId ? `{"gxAlertDeviceId":${device.gxAlertDeviceId}}` : '{}',
              ...auditFields,
            })
          } else {
            const deviceConfigurationData = JSON.parse(
              existingDevice.configurationData ? existingDevice.configurationData : '{}'
            )
            if (deviceConfigurationData.gxAlertDeviceId !== device.gxAlertDeviceId) {
              deviceConfigurationData.gxAlertDeviceId = device.gxAlertDeviceId
            }
            if (
              existingDevice.geographyId !== siteGeographyId ||
              existingDevice.siteId !== siteId ||
              existingDevice.deviceTypeId !== deviceTypeId ||
              existingDevice.name !== device.name ||
              existingDevice.shortName !== device.shortName ||
              existingDevice.macAddress !== device.macAddress ||
              existingDevice.hostId !== device.hostId ||
              existingDevice.timezone !== siteData.timezoneId ||
              existingDevice.configurationData !== JSON.stringify(deviceConfigurationData)
            ) {
              await knex('Device')
                .where('id', existingDevice.id)
                .update({
                  geographyId: siteGeographyId,
                  siteId,
                  deviceTypeId: await deviceTypeToId(device.deviceType),
                  name: device.name,
                  shortName: device.shortName,
                  serial: device.serial,
                  macAddress: device.macAddress,
                  hostId: device.hostId,
                  culture: philippinesCountry.culture,
                  timezone: siteData.timezoneId,
                  configurationData: JSON.stringify(deviceConfigurationData),
                  updatedOn: now,
                  updatedBy: adminId,
                })
            }
          }
        })
      )
    }
  })
}
