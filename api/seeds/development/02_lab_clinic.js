module.exports = require('../../src/db').seed(seed)

const config = require('../../src/config')
const _ = require('lodash')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const labClinic = require('./fixtures/labClinic.json')

const millisInHour = 1000 * 60 * 60
const saltRounds = parseInt(config.passwordSaltRounds, 10)

function* seed(knex) {
  // Skip this seed file if we already have an admin user
  const existingAdminUser = yield knex('User').where({ name: 'rrt_admin' }).first('id')
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
    failedPasswordAttempts: 0
  })
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId
  }

  // Reuse previously seeded "static" data
  const partnerTypes = yield rowsAsObject(knex, 'PartnerType')
  const [partnerId] = yield knex('Partner').insert({
    name: 'RRT',
    partnerTypeId: partnerTypes.Operating.id
  })
  const deviceTypeCategories = yield rowsAsObject(knex, 'DeviceTypeCategory')

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

  // RRT Device Type
  yield knex('DeviceType').insert({
    name: 'RRT',
    manufacturer: 'SystemOne',
    deviceTypeCategoryId: deviceTypeCategories.Client.id,
    configurationDataSchema: rrtConfigurationDataSchema
  })
  const deviceTypes = yield rowsAsObject(knex, 'DeviceType')
  const deviceStatuses = yield rowsAsObject(knex, 'DeviceStatus')

  // const assayTypes = yield rowsAsObject(knex, 'AssayType')
  // const assays = yield rowsAsObject(knex, 'Assay')
  // const resultTypes = yield rowsAsObject(knex, 'ResultType')
  const modules = yield knex('Permission')
    .reduce((memo, row) => {
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
  yield knex('Person').insert(Object.assign({
    userId: adminId,
    name: 'RRT Admin',
    lastPartnerId: partnerId,
    lastCountryId: countryId,
    geographyId,
    culture,
    timezone
  }, auditFields))

  const [roleIdAdmin] = yield knex('Role').insert({
    name: 'Admin',
    partnerId
  })

  yield knex('RolePermission').insert([
    { roleId: roleIdAdmin, permissionId: modules.demo.admin },
    { roleId: roleIdAdmin, permissionId: modules.device.admin },
    { roleId: roleIdAdmin, permissionId: modules.person.admin },
    { roleId: roleIdAdmin, permissionId: modules.result.admin },
    { roleId: roleIdAdmin, permissionId: modules.site.admin },
    { roleId: roleIdAdmin, permissionId: modules.assay.admin }])

  yield knex('UserRole').insert([
    { userId: adminId, roleId: roleIdAdmin }])

  const statesByName = malawiStates.reduce((memo, state) => {
    memo[state.name.toLowerCase()] = state
    return memo
  }, {})

  // every clinic has a site, RRT device and a user assigned to it
  for (const clinic of labClinic.clinics) {
    const { id: clinicGeographyId } = yield knex('Geography')
      .where({
        countryId,
        stateId: (statesByName[clinic.stateName.toLowerCase()] || { id: null }).id
      })
      .first()

    // sites
    const siteData = Object.assign({
      partnerId,
      geographyId: clinicGeographyId,
      name: clinic.name,
      shortname: clinic.shortname,
      externalId: clinic.externalId
    }, auditFields)
    const [siteId] = yield knex('Site').insert(siteData)
    siteData.id = siteId

    // Router
    const [routerId] = yield knex('Device').insert(Object.assign({}, auditFields, {
      name: `${siteData.name} Router`,
      shortname: `${siteData.shortname} Router`,
      deviceTypeId: deviceTypes['Metacom Router'].id,
      deviceStatusId: deviceStatuses.Approved.id,
      siteId: siteData.id,
      createdOn: new Date(+now - (3 * millisInHour)),
      updatedOn: new Date(+now - millisInHour),
      lastPingOn: new Date(+now - (millisInHour / 3))
    }))
    yield knex('DeviceSim').insert(Object.assign({
      deviceId: routerId,
      provider: 'Vodafone',
      serial: `SRL-${routerId}`,
      number: `+1 413 123 45${routerId}`
    }, auditFields))

    // RRT Terminal
    const [deviceId] = yield knex('Device').insert(Object.assign({
      name: `${siteData.name} RRT`,
      shortname: `${siteData.shortname} RRT`,
      deviceTypeId: deviceTypes.RRT.id,
      deviceStatusId: deviceStatuses.Approved.id,
      configurationData: JSON.stringify({
        requirePrinter: 'yes',
        adminPassword: 'pwd123',
        firmwareUpdateRequired: 'no',
        userPins: {
          user1Pin: '1234',
          user1Name: _.times(4, () => String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))).join(''),
          user1Assays: ['HivVl', 'Eid'],
          user2Pin: '2345',
          user2Name: _.times(4, () => String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))).join(''),
          user2Assays: ['HivVl'],
          user3Pin: '3456',
          user3Name: _.times(4, () => String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))).join(''),
          user3Assays: ['Eid'],
          user4Pin: '4567',
          user4Name: _.times(4, () => String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))).join(''),
          user4Assays: ['HivVl', 'Eid'],
          user5Pin: '5678',
          user5Name: _.times(4, () => String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))).join(''),
          user5Assays: ['HivVl'],
          adminPin: '99999',
          adminName: _.times(4, () => String.fromCharCode(65 + _.random(25) + (_.random(1) > 0 ? 32 : 0))).join(''),
          adminAssays: ['HivVl', 'Eid']
        }
      }),
      partnerId: siteData.partnerId,
      orgUnitId: siteData.orgUnitId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      deviceId: routerId,
      createdOn: new Date(+now - (3 * millisInHour)),
      updatedOn: new Date(+now - (millisInHour)),
      lastPingOn: new Date(+now - (millisInHour / 3))
    }, auditFields))

    yield knex('DeviceApiKey').insert(Object.assign({
      token: crypto.randomBytes(48).toString('base64'),
      revoked: 0,
      partnerId: siteData.partnerId,
      orgUnitId: siteData.orgUnitId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      deviceTypeId: deviceTypes.RRT.id,
      deviceId
    }, auditFields))

    // Roles and permissions
    const [dataFilterId] = yield knex('DataFilter').insert({
      name: `${siteData.name} Filter`,
      constraint: JSON.stringify({
        sample: {
          originSiteId: siteId
        }
      })
    })

    const [roleIdSite] = yield knex('Role').insert({
      name: `${siteData.name} RRT Samples`,
      partnerId,
      dataFilterId
    })

    yield knex('RolePermission').insert([
      { roleId: roleIdSite, permissionId: modules.device.edit }
    ])

    yield knex('DeviceRole').insert([
       { deviceId, roleId: roleIdSite }])
  }

  // Labs have m2000 and modem
  for (const lab of labClinic.labs) {
    // every clinic has a site, RRT device and a user assigned to it
    const siteData = Object.assign({
      partnerId,
      geographyId,
      name: lab.name,
      shortname: lab.shortname,
      externalId: lab.externalId
    }, auditFields)
    const [siteId] = yield knex('Site').insert(siteData)
    siteData.id = siteId

    // Router
    const [routerId] = yield knex('Device').insert(Object.assign({}, auditFields, {
      name: `${siteData.name} Router`,
      shortname: `${siteData.shortname} Router`,
      deviceTypeId: deviceTypes['Metacom Router'].id,
      deviceStatusId: deviceStatuses.Approved.id,
      partnerId: siteData.partnerId,
      orgUnitId: siteData.orgUnitId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      createdOn: new Date(+now - (3 * millisInHour)),
      updatedOn: new Date(+now - millisInHour),
      lastPingOn: new Date(+now - (millisInHour / 3))
    }))
    yield knex('DeviceSim').insert(Object.assign({
      deviceId: routerId,
      provider: 'Vodafone',
      serial: `SRL-${routerId}`,
      number: `+1 413 123 45${routerId}`
    }, auditFields))

    // M2000 Device
    const [deviceId] = yield knex('Device').insert(Object.assign({
      name: `${siteData.name} m2000`,
      shortname: `${siteData.shortname} m2000`,
      deviceTypeId: deviceTypes.m2000.id,
      deviceStatusId: deviceStatuses.Approved.id,
      configurationData: JSON.stringify({
        requirePrinter: 'yes',
        adminPassword: 'pwd123',
        firmwareUpdateRequired: 'yes',
        firmwareVersions: {
          versionAlpha: '0.9.12-alpha',
          versionBeta: '1.0.0-beta',
          versionRC: '1.0.1-rc',
          versionGold: '1.1.0',
        }
      }),
      partnerId: siteData.partnerId,
      orgUnitId: siteData.orgUnitId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      deviceId: routerId,
      createdOn: new Date(+now - (3 * millisInHour)),
      updatedOn: new Date(+now - millisInHour),
      lastPingOn: new Date(+now - (millisInHour / 3))
    }, auditFields))

    yield knex('DeviceApiKey').insert(Object.assign({
      token: crypto.randomBytes(48).toString('base64'),
      revoked: 0,
      partnerId: siteData.partnerId,
      orgUnitId: siteData.orgUnitId,
      geographyId: siteData.geographyId,
      siteId: siteData.id,
      deviceTypeId: deviceTypes.m2000.id,
      deviceId
    }, auditFields))

    // create lab admin user with permission to view data to own lab
    const [labAdminUserId] = yield knex('User').insert({
      name: `rrt_${lab.externalId.toLowerCase()}`,
      password: bcrypt.hashSync('test07', saltRounds),
      approved: 1,
      createdOn: now,
      lockedOut: 0,
      failedPasswordAttempts: 0
    })

    yield knex('Person').insert(Object.assign({
      userId: labAdminUserId,
      name: `${lab.shortname} Admin`,
      lastPartnerId: partnerId,
      lastCountryId: countryId,
      geographyId,
      culture,
      timezone
    }, auditFields))

    const [labAdminDataFilterId] = yield knex('DataFilter').insert({
      name: `${siteData.name} Filter`,
      constraint: JSON.stringify({
        site: {
          id: siteId
        }
      })
    })

    const [roleIdLabAdmin] = yield knex('Role').insert({
      name: `${lab.shortname} Admin`,
      dataFilterId: labAdminDataFilterId,
      partnerId
    })

    yield knex('RolePermission').insert([
      { roleId: roleIdLabAdmin, permissionId: modules.device.admin },
      { roleId: roleIdLabAdmin, permissionId: modules.result.admin }])

    yield knex('UserRole').insert([
      { userId: labAdminUserId, roleId: roleIdLabAdmin }])
  }
}

function rowsAsObject(knex, table, column = 'name') {
  return knex(table)
    .reduce((memo, row) => {
      memo[row[column]] = row
      return memo
    }, {})
}
