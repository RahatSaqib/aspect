module.exports = require('../../src/db').seed(seed)

const config = require('../../src/config')
const bcrypt = require('bcrypt')
const { randomToken } = require('../../src/deviceApi/apiKey')
const labClinic = require('./fixtures/labClinic.json')

const saltRounds = parseInt(config.passwordSaltRounds, 10)

function* seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = yield knex('User')
    .where({ name: 'rrt_admin' })
    .first('id')
  if (existingAdminUser) {
    return
  }

  // Create admin user and audit fields
  const now = new Date()
  const [adminId] = yield knex('User').insert({
    name: 'rrt_admin',
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
  const partnerTypes = yield rowsAsObject(knex, 'PartnerType')
  const [partnerId] = yield knex('Partner').insert({
    name: 'RRT',
    partnerTypeId: partnerTypes.Operating.id,
    plugin: 'malawi',
    deviceLogHistoryDays: 365,
    autoAcknowledgeOlderThanDays: 28,
    numberToLeaveUnacknowledged: 15,
  })
  const deviceTypeCategories = yield rowsAsObject(knex, 'DeviceTypeCategory')

  /* TODO Add configuration schema once UI supports and we synchronize correctly
  // define configurationData object
  const rrtConfigurationDataSchema = JSON.stringify({
    requirePrinter: {
      title: 'Require printer',
      type: 'string'
    },
    adminPassword: {
      title: 'Admin password',
      type: 'string'
    },
    firmwareUpdateRequired: {
      title: 'Firmware update required',
      type: 'string'
    },
    userPins: {
      title: 'Pins',
      type: 'object',
      i18nKey: 'User Pins',
      properties: {
        user1Pin: {
          title: 'user1Pin',
          type: 'string'
        },
        user1Name: {
          title: 'user1Name',
          type: 'string'
        },
        user1Assays: {
          title: 'user1Assays',
          type: 'array'
        },
        user2Pin: {
          title: 'user2Pin',
          type: 'string'
        },
        user2Name: {
          title: 'user2Name',
          type: 'string'
        },
        user2Assays: {
          title: 'user2Assays',
          type: 'array'
        },
        user3Pin: {
          title: 'user3Pin',
          type: 'string'
        },
        user3Name: {
          title: 'user3Name',
          type: 'string'
        },
        user3Assays: {
          title: 'user3Assays',
          type: 'array'
        },
        user4Pin: {
          title: 'user4Pin',
          type: 'string'
        },
        user4Name: {
          title: 'user4Name',
          type: 'string'
        },
        user4Assays: {
          title: 'user4Assays',
          type: 'array'
        },
        user5Pin: {
          title: 'user5Pin',
          type: 'string'
        },
        user5Name: {
          title: 'user5Name',
          type: 'string'
        },
        user5Assays: {
          title: 'user5Assays',
          type: 'array'
        },
        adminPin: {
          title: 'adminPin',
          type: 'string'
        },
        adminName: {
          title: 'adminName',
          type: 'string'
        },
        adminAssays: {
          title: 'adminAssays',
          type: 'array'
        }
      }
    }
  })
*/

  // RRT Device Type
  yield knex('DeviceType').insert({
    name: 'RRT',
    manufacturer: 'SystemOne',
    deviceTypeCategoryId: deviceTypeCategories.Client.id,
    // configurationDataSchema: rrtConfigurationDataSchema
  })

  const modules = yield knex('Permission').reduce((memo, row) => {
    if (!memo[row.module]) {
      memo[row.module] = {}
    }
    memo[row.module][row.activity] = row.id
    return memo
  }, {})

  // Create clinics for every state in Malawi
  const [malawiCountry] = yield knex('Country as c')
    .where({ 'c.a3': 'MWI' })
    .select('c.id', 'c.culture', 'c.timezone')

  const malawiStates = yield knex('Geography as g')
    .innerJoin('State as s', 's.id', 'g.stateId')
    .where({ 'g.countryId': malawiCountry.id })
    .select('g.countryId', 's.id', 's.name')

  const { culture, timezone, id: countryId } = malawiCountry

  const { id: geographyId } = yield knex('Geography')
    .where({ countryId })
    .first()

  // Permissions for RRT Admin
  const [adminPersonId] = yield knex('Person').insert(
    Object.assign(
      {
        userId: adminId,
        name: 'RRT Admin',
        lastPartnerId: partnerId,
        lastCountryId: countryId,
        geographyId,
        culture,
        timezone,
      },
      auditFields
    )
  )

  const [jobFunctionIdAdmin] = yield knex('JobFunction').insert({
    name: 'Admin',
    partnerId,
  })

  const [jobFunctionIdLabAdmin] = yield knex('JobFunction').insert({
    name: 'Lab Admin',
    partnerId,
  })
  yield knex('JobFunctionPermission').insert([
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      permissionId: modules.device.admin,
    },
    {
      jobFunctionId: jobFunctionIdLabAdmin,
      permissionId: modules.result.admin,
    },
  ])

  yield knex('JobFunctionPermission').insert([
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

  const [jobIdAdmin] = yield knex('Job').insert([
    { personId: adminPersonId, jobFunctionId: jobFunctionIdAdmin },
  ])
  yield knex('JobContext').insert({ jobId: jobIdAdmin, geographyId })

  const statesByName = malawiStates.reduce((memo, state) => {
    memo[state.name.toLowerCase()] = state
    return memo
  }, {})

  // every clinic has a site, RRT device and a user assigned to it
  for (const clinic of labClinic.clinics) {
    const { id: clinicGeographyId } = yield knex('Geography')
      .where({
        countryId,
        stateId: (statesByName[clinic.stateName.toLowerCase()] || { id: null })
          .id,
      })
      .first()

    // sites
    const siteData = Object.assign(
      {
        partnerId,
        geographyId: clinicGeographyId,
        name: clinic.name,
        shortname: clinic.shortname,
        externalId: clinic.externalId,
      },
      auditFields
    )
    const [siteId] = yield knex('Site').insert(siteData)
    siteData.id = siteId
  }

  // Labs have m2000 and modem
  for (const lab of labClinic.labs) {
    // every clinic has a site, RRT device and a user assigned to it
    const siteData = Object.assign(
      {
        partnerId,
        geographyId,
        name: lab.name,
        shortname: lab.shortname,
        externalId: lab.externalId,
      },
      auditFields
    )
    const [siteId] = yield knex('Site').insert(siteData)
    siteData.id = siteId

    // create lab admin user with permission to view data to own lab
    const [labAdminUserId] = yield knex('User').insert({
      name: `rrt_${lab.externalId.toLowerCase()}`,
      password: bcrypt.hashSync('test07', saltRounds),
      approved: 1,
      createdOn: now,
      lockedOut: 0,
      failedPasswordAttempts: 0,
    })

    const [labAdminPersonId] = yield knex('Person').insert(
      Object.assign(
        {
          userId: labAdminUserId,
          name: `${lab.shortname} Admin`,
          lastPartnerId: partnerId,
          lastCountryId: countryId,
          geographyId,
          culture,
          timezone,
        },
        auditFields
      )
    )

    const [jobIdLabAdmin] = yield knex('Job').insert([
      { personId: labAdminPersonId, jobFunctionId: jobFunctionIdLabAdmin },
    ])
    yield knex('JobContext').insert({ jobId: jobIdLabAdmin, siteId })

    if (lab.devices) {
      for (const device of lab.devices) {
        const { id: partnerId } = yield knex('Partner')
          .where({ name: device.partnerName })
          .first()
        const { id: deviceTypeId } = yield knex('DeviceType')
          .where({ name: device.deviceTypeName })
          .first()
        const { id: deviceStatusId } = yield knex('DeviceStatus')
          .where({ token: device.deviceStatusToken })
          .first()

        const [deviceId] = yield knex('Device').insert(
          Object.assign(
            {
              partnerId,
              geographyId,
              siteId,
              deviceTypeId,
              deviceStatusId,
              deviceId: device.deviceId,
              name: device.name,
              shortName: device.shortName,
              macAddress: device.macAddress,
              serial: device.serial,
              hostId: device.hostId,
              culture: device.culture,
              timeZone: device.timeZone,
              notes: device.notes,
              lastSeenOn: device.lastSeenOn || new Date(),
              lastPingOn: device.lastPingOn,
              lastPingFromIp: device.lastPingFromIp,
              putInService: device.putInService,
              putInServiceSource: device.putInServiceSource,
              approvedOn: device.approvedOn,
              approvedBy: labAdminPersonId,
              configurationData: device.configurationData,
            },
            auditFields
          )
        )

        yield knex('DeviceApiKey').insert(
          Object.assign(
            {
              token: randomToken(),
              revoked: 0,
              partnerId,
              geographyId,
              siteId,
              deviceId,
            },
            auditFields
          )
        )
      }
    }
  }
}

function rowsAsObject(knex, table, column = 'name') {
  return knex(table).reduce((memo, row) => {
    memo[row[column]] = row
    return memo
  }, {})
}
