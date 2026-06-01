module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const Promise = require('bluebird')

const geography = require('./fixtures/geography.json')
const labClinic = require('./fixtures/labClinic.json')
const { randomToken } = require('../../src/deviceApi/apiKey')
const { deviceApprovalToId } = require('../../src/shared/dictionary')
const { insertSite } = require('../../src/site/common/db')

async function seed(knex) {
  const { id: adminId } = await knex('User').where({ name: 'admin' }).first('id')
  const now = new Date()

  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // Create geographic hierarchy
  const countries = {}
  const geographies = []
  await Promise.all(
    _.map(geography.countries, async country => {
      let countryData = await knex('Country')
        .where('abbreviation', country.abbreviation)
        .first(
          'id',
          'abbreviation',
          'name',
          'a3',
          'culture',
          'countryCode',
          'timezone',
          'portNumber',
          'exportColumns',
          'inventoryDaysThreshold',
          'monthStartsOnDay'
        )
      if (_.isEmpty(countryData)) {
        countryData = _.pick(country, [
          'abbreviation',
          'name',
          'a3',
          'culture',
          'countryCode',
          'timezone',
          'portNumber',
          'exportColumns',
          'inventoryDaysThreshold',
          'monthStartsOnDay',
        ])
        ;[countryData.id] = await knex('Country').insert(countryData)
        const [countryGeographyId] = await knex('Geography').insert({
          countryId: countryData.id,
        })
        countryData.geographyId = countryGeographyId
      } else {
        const { id: geographyId } = await knex('Geography')
          .whereNull('stateId')
          .whereNull('lgaId')
          .andWhere('countryId', countryData.id)
          .first('id')
        countryData.geographyId = geographyId
      }
      countries[country.abbreviation] = countryData
      countryData.states = {}

      geographies.push({
        id: countryData.geographyId,
        countryId: countryData.id,
        stateId: null,
        lgaId: null,
      })

      await Promise.all(
        _.map(country.states || [], async state => {
          let stateData = await knex('State as s')
            .join('Geography as g', 's.id', 'g.stateId')
            .where('g.countryId', countryData.id)
            .andWhere('s.name', state.name)
            .first('s.id', 'g.countryId', 's.abbreviation', 's.name')
          if (_.isEmpty(stateData)) {
            stateData = _.pick(state, ['abbreviation', 'name'])
            ;[stateData.id] = await knex('State').insert(stateData)
            stateData.countryId = countryData.id
            const [stateGeographyId] = await knex('Geography').insert({
              countryId: countryData.id,
              stateId: stateData.id,
            })
            stateData.geographyId = stateGeographyId
          } else {
            const { id: geographyId } = await knex('Geography')
              .whereNull('lgaId')
              .andWhere('stateId', stateData.id)
              .andWhere('countryId', countryData.id)
              .first('id')
            stateData.geographyId = geographyId
          }
          countryData.states[stateData.name] = stateData
          stateData.lgas = {}

          geographies.push({
            id: stateData.geographyId,
            countryId: countryData.id,
            stateId: stateData.id,
            lgaId: null,
          })

          await Promise.all(
            _.map(state.lgas || [], async lga => {
              let lgaData = await knex('Lga as l')
                .join('Geography as g', 'l.id', 'g.lgaId')
                .where('g.stateId', stateData.id)
                .andWhere('g.countryId', countryData.id)
                .andWhere('l.name', lga.name)
                .first('l.id', 'g.stateId', 'l.name')
              if (_.isEmpty(lgaData)) {
                lgaData = _.pick(lga, ['name'])
                ;[lgaData.id] = await knex('Lga').insert(lgaData)
                lgaData.stateId = stateData.id
                const [lgaGeographyId] = await knex('Geography').insert({
                  countryId: countryData.id,
                  stateId: stateData.id,
                  lgaId: lgaData.id,
                })
                lgaData.geographyId = lgaGeographyId
              } else {
                const { id: geographyId } = await knex('Geography')
                  .where('lgaId', lgaData.id)
                  .andWhere('stateId', stateData.id)
                  .andWhere('countryId', countryData.id)
                  .first('id')
                lgaData.geographyId = geographyId
              }
              lgaData.sites = {}
              stateData.lgas[lgaData.name] = lgaData

              geographies.push({
                id: lgaData.geographyId,
                countryId: countryData.id,
                stateId: stateData.id,
                lgaId: lgaData.id,
              })
            })
          )
        })
      )
    })
  )
  const approvedDeviceApprovalId = await deviceApprovalToId('approved')

  const { id: partnerId } = await knex('Partner').where('name', 'Zimbabwe').first('id')
  await Promise.all(
    _.map(labClinic.labs, async lab => {
      const siteData = (await knex('Site').where('externalId', lab.externalId).first()) || {}
      if (_.isEmpty(siteData)) {
        const labGeographyId = _.get(
          countries,
          ['ZW', 'states', lab.stateName, 'lgas', lab.lgaName, 'geographyId'],
          _.get(countries, ['ZW', 'states', lab.stateName, 'geographyId'], _.get(countries, ['ZW', 'geographyId']))
        )
        siteData.partnerId = partnerId
        siteData.geographyId = labGeographyId
        siteData.name = lab.name
        siteData.shortName = lab.shortName
        siteData.externalId = lab.externalId
        siteData.latitude = lab.latitude
        siteData.longitude = lab.longitude
        const [siteId] = await insertSite(knex, {
          ...siteData,
          ...auditFields,
        })
        siteData.id = siteId
      }

      if (lab.devices) {
        await Promise.all(
          _.map(lab.devices, async device => {
            const deviceApiKeyToken = device.deviceApiKey || randomToken()
            const deviceData =
              (await knex('DeviceApiKey as dak')
                .join('Device as d', 'd.deviceApiKeyId', 'dak.id')
                .where('dak.token', deviceApiKeyToken)
                .first('d.*')) || {}
            if (_.isEmpty(deviceData)) {
              deviceData.partnerId = partnerId
              deviceData.siteId = siteData.id
              deviceData.deviceApprovalId = approvedDeviceApprovalId
              deviceData.name = device.name
              deviceData.shortName = device.shortName
              deviceData.serial = device.deviceSerial
              deviceData.lastSeenOn = now
              deviceData.putInService = now
              deviceData.putInServiceSource = 'Installed at lab'
              deviceData.configurationData = '{}'
              const { id: deviceTypeId } =
                (await knex('DeviceType').where('externalId', device.deviceTypeId).first('id')) || {}
              const [deviceId] = await knex('Device').insert({
                ...deviceData,
                deviceTypeId,
                ...auditFields,
              })
              deviceData.id = deviceId
              const [deviceApiKeyId] = await knex('DeviceApiKey').insert({
                token: deviceApiKeyToken,
                revoked: 0,
                partnerId,
                geographyId: siteData.geographyId,
                siteId: siteData.id,
                ...auditFields,
              })
              await knex('Device').where('id', deviceId).update({ deviceApiKeyId })
            }
          })
        )
      }
    })
  )
}
