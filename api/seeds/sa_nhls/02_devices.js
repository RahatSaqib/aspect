module.exports = require('../utils').seed(seed)

const _ = require('lodash')
const labClinic = require('./fixtures/labClinic.json')

const {
  deviceTypeToId,
  deviceStatusToId,
} = require('../../src/shared/dictionary')

async function seed(knex) {
  const existingSites = await knex('Site')
    .where({ name: 'CHBAH Maternity POCT' })
    .first('id')
  if (existingSites) {
    return
  }
  const now = new Date()
  const { id: adminId } = await knex('User')
    .where({ name: 'nhls_eid' })
    .first('id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  const { id: partnerId } = await knex('Partner')
    .where('name', 'South Africa NHLS')
    .first()

  // TODO: Collect and add all device serials and sites
  const southAfricaCountry = await knex('Country as c')
    .where({ 'c.a3': 'ZAF' })
    .first('c.id', 'c.culture', 'c.timezone')
  const southAfricaProvinces = await knex('Geography as g')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': southAfricaCountry.id })
    .select('g.countryId', 's.id', 's.name')
  const southAfricaDistricts = await knex('Geography as g')
    .innerJoin('Lga as l', 'l.id', 'g.lgaId')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': southAfricaCountry.id })
    .select('g.countryId', 'l.id', 'l.name', 's.name as stateName')
  const provincesByName = southAfricaProvinces.reduce(
    (provinceMemo, province) => {
      provinceMemo[province.name.toLowerCase()] = province
      const provinceDistricts = _.filter(southAfricaDistricts, {
        stateName: province.name,
      })
      if (provinceDistricts) {
        provinceMemo[
          province.name.toLowerCase()
        ].districts = provinceDistricts.reduce((districtMemo, district) => {
          districtMemo[district.name.toLowerCase()] = district
          return districtMemo
        }, {})
      }
      return provinceMemo
    },
    {}
  )

  await Promise.all(
    _.map(labClinic.clinics, async clinic => {
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
      const { id: clinicGeographyId } = await knex('Geography')
        .where({
          countryId: southAfricaCountry.id,
          stateId: province.id,
          lgaId: district.id,
        })
        .first()

      // sites
      const siteData = Object.assign(
        {
          partnerId,
          geographyId: clinicGeographyId,
          name: clinic.name,
          shortName: clinic.shortName,
          externalId: clinic.externalId,
          latitude: clinic.latitude,
          longitude: clinic.longitude,
          timezoneId: southAfricaCountry.timezone,
        },
        auditFields
      )
      const [siteId] = await knex('Site').insert(siteData)
      siteData.id = siteId

      if (clinic.devices) {
        await Promise.all(
          _.map(clinic.devices, async device =>
            knex('Device').insert(
              Object.assign(
                {
                  partnerId,
                  geographyId: clinicGeographyId,
                  siteId,
                  deviceTypeId: await deviceTypeToId(device.deviceTypeId),
                  deviceStatusId: await deviceStatusToId('approved'),
                  name: `${siteData.shortName} ${device.deviceTypeId} ${
                    device.deviceSerial
                  }`,
                  shortName: `${device.deviceTypeId} ${device.deviceSerial}`,
                  serial: device.deviceSerial,
                  culture: southAfricaCountry.culture,
                  timezone: siteData.timezoneId,
                  configurationData: '{}',
                },
                auditFields
              )
            )
          )
        )
      }
    })
  )
}
