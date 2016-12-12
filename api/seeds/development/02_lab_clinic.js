module.exports = require('../../src/db').seed(seed)

const config = require('../../src/config')
const bcrypt = require('bcrypt')
const labClinic = require('./fixtures/labClinic.json')

const millisInHour = 1000 * 60 * 60
const saltRounds = parseInt(config.passwordSaltRounds, 10)

function* seed(knex) {
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
  // RRT Device Type
  yield knex('DeviceType').insert({
    name: 'RRT',
    manufacturer: 'SystemOne',
    deviceTypeCategoryId: deviceTypeCategories.Client.id
  })
  const deviceTypes = yield rowsAsObject(knex, 'DeviceType')

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

  const malawiStates = yield knex('State as s')
    .where({ 's.countryId': malawiCountry.id })
    .select('s.countryId', 's.id', 's.name')

  const { culture, timezone, id: countryId } = malawiCountry

  // Permissions for RRT Admin
  yield knex('Person').insert(Object.assign({
    userId: adminId,
    name: 'RRT Admin',
    lastPartnerId: partnerId,
    lastCountryId: countryId,
    countryId,
    stateId: malawiStates[0].stateId,
    culture,
    timezone
  }, auditFields))

  const [roleIdAdmin] = yield knex('Role').insert({
    name: 'Admin',
    partnerId
  })

  yield knex('RolePermission').insert([
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
    const geoData = {
      countryId,
      stateId: (statesByName[clinic.stateName.toLowerCase()] || { id: null }).id
    }

    // sites
    const siteData = Object.assign({
      partnerId,
      name: clinic.name,
      shortname: clinic.shortname,
      externalId: clinic.externalId
    }, geoData, auditFields)
    const [siteId] = yield knex('Site').insert(siteData)
    siteData.id = siteId

    // Router
    const [routerId] = yield knex('Device').insert(Object.assign({}, auditFields, {
      name: `${siteData.name} Router`,
      shortname: `${siteData.name} Router`,
      deviceTypeId: deviceTypes['Metacom Router'].id,
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
      shortname: `${siteData.name} RRT`,
      deviceTypeId: deviceTypes.RRT.id,
      siteId: siteData.id,
      deviceId: routerId,
      createdOn: new Date(+now - (3 * millisInHour)),
      updatedOn: new Date(+now - (millisInHour)),
      lastPingOn: new Date(+now - (millisInHour / 3))
    }, auditFields))

    yield knex('DeviceApiKey').insert(Object.assign({
      deviceId,
      revoked: 0
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
    const geoData = {
      countryId
    }

    // every clinic has a site, RRT device and a user assigned to it
    const siteData = Object.assign({
      partnerId,
      name: lab.name,
      shortname: lab.shortname,
      externalId: lab.externalId
    }, geoData, auditFields)
    const [siteId] = yield knex('Site').insert(siteData)
    siteData.id = siteId

    // Router
    const [routerId] = yield knex('Device').insert(Object.assign({}, auditFields, {
      name: `${siteData.name} Router`,
      shortname: `${siteData.shortname} Router`,
      deviceTypeId: deviceTypes['Metacom Router'].id,
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
      name: `${siteData.name} m2000`,
      shortname: `${siteData.shortname} m2000`,
      deviceTypeId: deviceTypes.m2000.id,
      siteId: siteData.id,
      deviceId: routerId,
      createdOn: new Date(+now - (3 * millisInHour)),
      updatedOn: new Date(+now - millisInHour),
      lastPingOn: new Date(+now - (millisInHour / 3))
    }, auditFields))

    yield knex('DeviceApiKey').insert(Object.assign({
      deviceId,
      revoked: 0
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
      countryId,
      stateId: malawiStates[0].stateId,
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
