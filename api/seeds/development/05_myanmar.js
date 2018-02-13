module.exports = require('../../src/db').seed(seed)

const bcrypt = require('bcrypt')
const _ = require('lodash')

const config = require('../../src/config')
const myanmarSites = require('./fixtures/myanmarSites.json')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

async function seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = await knex('User')
    .where({ name: 'myanmar_admin' })
    .first('id')
  if (existingAdminUser) {
    return
  }

  // Create admin user and audit fields
  const now = new Date()
  const [adminId] = await knex('User').insert({
    name: 'myanmar_admin',
    password: bcrypt.hashSync('test07', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0,
  })
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // Reuse previously seeded "static" data
  const partnerTypes = await rowsAsObject(knex, 'PartnerType', 'name')
  const deviceTypes = await rowsAsObject(knex, 'DeviceType', 'externalId')
  const deviceStatuses = await rowsAsObject(knex, 'DeviceStatus', 'token')

  const [partnerId] = await knex('Partner').insert({
    name: 'Myanmar',
    partnerTypeId: partnerTypes.Operating.id,
    // plugin: 'myanmar',
    deviceLogHistoryDays: 365,
    autoAcknowledgeOlderThanDays: 28,
    numberToLeaveUnacknowledged: 15,
    maxDaysDeviceOffline: 7,
  })

  const modules = await knex('Permission').reduce((memo, row) => {
    if (!memo[row.module]) {
      memo[row.module] = {}
    }
    memo[row.module][row.activity] = row.id
    return memo
  }, {})

  const [myanmarCountry] = await knex('Country as c')
    .where({ 'c.a3': 'MMR' })
    .select('c.id', 'c.culture', 'c.timezone')
  const countryId = myanmarCountry.id

  const { id: myanmarGeographyId } = await knex('Geography')
    .where({ countryId })
    .whereNull('stateId', 'lgaId')
    .first()

  // Permissions for Myanmar Admin
  const [adminPersonId] = await knex('Person').insert(
    Object.assign(
      {
        userId: adminId,
        name: 'Myanmar Admin',
        lastPartnerId: partnerId,
        lastCountryId: countryId,
        geographyId: myanmarGeographyId,
        culture: myanmarCountry.culture,
        timezone: myanmarCountry.timezone,
      },
      auditFields
    )
  )

  const [jobFunctionIdAdmin] = await knex('JobFunction').insert({
    name: 'Admin',
    partnerId,
  })

  await knex('JobFunctionPermission').insert([
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.demo.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.device.admin },
    {
      jobFunctionId: jobFunctionIdAdmin,
      permissionId: modules.deviceApiKey.admin,
    },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.person.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.result.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.site.admin },
    { jobFunctionId: jobFunctionIdAdmin, permissionId: modules.assay.admin },
  ])

  const [jobIdAdmin] = await knex('Job').insert([
    { personId: adminPersonId, jobFunctionId: jobFunctionIdAdmin },
  ])
  await knex('JobContext').insert({
    jobId: jobIdAdmin,
    geographyId: myanmarGeographyId,
  })

  const myanmarStates = await knex('Geography as g')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': countryId })
    .whereNull('g.lgaId')
    .select('s.id', 's.name', 's.abbreviation')

  const myanmarLgas = await knex('Geography as g')
    .innerJoin('Lga as l', 'l.id', 'g.lgaId')
    .where({ 'g.countryId': countryId })
    .select('l.id', 'l.name')

  const statesByAbbreviation = myanmarStates.reduce((memo, state) => {
    memo[state.abbreviation] = state
    return memo
  }, {})

  const lgasByName = myanmarLgas.reduce((memo, lga) => {
    memo[lga.name] = lga
    return memo
  }, {})

  // every clinic has a site, GxAlert device
  await Promise.all(
    _.map(myanmarSites.sites, async site => {
      const { id: siteGeographyId } = await knex('Geography')
        .where({
          countryId,
          stateId: (
            statesByAbbreviation[site.stateAbbreviation] || { id: null }
          ).id,
          lgaId: (lgasByName[site.lgaName] || { id: null }).id,
        })
        .first()

      // sites
      const siteData = Object.assign(
        {
          partnerId,
          geographyId: siteGeographyId,
          name: site.name,
          shortname: site.shortname,
          externalId: site.externalId,
          notes: site.notes,
          city: site.city,
          street1: site.street1,
          street2: site.street2,
          zip: site.zip,
          latitude: site.latitude,
          longitude: site.longitude,
          timezoneId: site.timezoneId,
          hoursStart: site.hoursStart,
          hoursEnd: site.hoursEnd,
        },
        auditFields
      )
      const [siteId] = await knex('Site').insert(siteData)
      siteData.id = siteId

      await Promise.all(
        _.map(site.devices, device =>
          knex('Device').insert({
            partnerId,
            geographyId: siteGeographyId,
            siteId,
            deviceTypeId: deviceTypes.CepheidGeneXpert.id,
            deviceStatusId: deviceStatuses.approved.id,
            name: device.name,
            shortname: device.shortname,
            macAddress: device.macAddress,
            serial: device.serial,
            hostId: device.hostId,
            culture: device.culture,
            timezone: device.timezone,
            notes: device.notes,
            lastSeenOn: now,
          })
        )
      )
    })
  )
}

function rowsAsObject(knex, table, column = 'name') {
  return knex(table).reduce((memo, row) => {
    memo[row[column]] = row
    return memo
  }, {})
}
