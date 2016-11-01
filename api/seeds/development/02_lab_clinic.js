module.exports = require('../../src/db').seed(seed)

const config = require('../../src/config')
const bcrypt = require('bcrypt')
const _ = require('lodash')
const millisInHour = 1000*60*60
const saltRounds = parseInt(config.passwordSaltRounds)

function* seed(knex){
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

  //const assayTypes = yield rowsAsObject(knex, 'AssayType')
  //const assays = yield rowsAsObject(knex, 'Assay')
  //const resultTypes = yield rowsAsObject(knex, 'ResultType')
  const modules = yield knex('Permission')
    .reduce((memo, row) => {
      if(!memo[row.module]){
        memo[row.module] = {}
      }
      memo[row.module][row.activity] = row.id
      return memo
    }, {})


  // Create clinics for every state in Malawi
  const [malawiCountry] = yield knex('Country as c')
    .where({'c.a3': 'MWI'})
    .select('c.id', 'c.culture', 'c.timezone')

  const malawiStates = yield knex('State as s')
    .where({'s.countryId': malawiCountry.id})
    .select('s.countryId', 's.id', 's.name')

  const {culture, timezone} = malawiCountry

  // Permissions for RRT Admin
  yield knex('Person').insert(Object.assign({
    userId: adminId,
    name: 'RRT Admin',
    lastPartnerId: partnerId,
    lastCountryId: malawiStates[0].countryId,
    countryId: malawiStates[0].countryId,
    stateId: malawiStates[0].stateId,
    culture,
    timezone
  }, auditFields))

  const [roleIdAdmin] = yield knex('Role').insert({
    name: 'Admin',
    partnerId: partnerId
  })

  yield knex('RolePermission').insert([
    { roleId: roleIdAdmin, permissionId: modules.device.admin },
    { roleId: roleIdAdmin, permissionId: modules.person.admin },
    { roleId: roleIdAdmin, permissionId: modules.result.admin },
    { roleId: roleIdAdmin, permissionId: modules.site.admin },
    { roleId: roleIdAdmin, permissionId: modules.assay.admin }])

  yield knex('UserRole').insert([
    { userId: adminId, roleId: roleIdAdmin }])

  // every clinic has a site, RRT device and a user assigned to it
  for(let state of malawiStates){
    const geoData = {
      countryId: state.countryId,
      stateId: state.id
    }

    // sites
    const siteData = Object.assign({
      partnerId,
      name: `${state.name} Clinic`,
      shortname: `C: ${state.name}`,
      externalId: `clinic_${state.name}`,
      city: `${state.name} City`,
      street1: `${state.id} Main Street`,
      zip: `12345-${state.id}`
    }, geoData, auditFields)
    const [siteId] = yield knex('Site').insert(siteData)
    siteData.id = siteId

    // Router
    const [routerId] = yield knex('Device').insert(Object.assign({}, auditFields, {
      name: `Router at ${siteData.name}`,
      shortname: 'r'+siteData.shortname,
      deviceTypeId: deviceTypes['Metacom Router'].id,
      siteId: siteData.id,
      createdOn: new Date(+now - 3*millisInHour),
      updatedOn: new Date(+now - millisInHour),
      lastPingOn: new Date(+now - millisInHour/3)
    }))
    yield knex('DeviceSim').insert(Object.assign({
      deviceId: routerId,
      provider: 'Vodafone',
      serial: 'SRL-' + routerId,
      number: '+1 413 123 45' + routerId
    }, auditFields))

    // RRT Terminal
    const [deviceId] = yield knex('Device').insert(Object.assign({
      name: `RRT at ${siteData.name}`,
      shortname: 'd'+siteData.shortname,
      deviceTypeId: deviceTypes['RRT'].id,
      siteId: siteData.id,
      deviceId: routerId,
      createdOn: new Date(+now - 3*millisInHour),
      updatedOn: new Date(+now - millisInHour),
      lastPingOn: new Date(+now - millisInHour/3)
    }, auditFields))

    yield knex('DeviceApiKey').insert(Object.assign({
      deviceId,
      revoked: 0
    }, auditFields))

    // Roles and permissions
    // TODO allow data filter on site and sample source site
    const [dataFilterId] = yield knex('DataFilter').insert({
      name: siteData.name+' Filter',
      constraint: JSON.stringify({
        sample: {
          originSiteId: siteId
        }
      })
    })

    const [roleIdSite] = yield knex('Role').insert({
      name: `RRT at ${siteData.name} Samples`,
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
  for(let state of _.filter(malawiStates, s => _.includes(['Dedza', 'Chitipa', 'Balaka'], s.name))){
    const geoData = {
      countryId: state.countryId,
      stateId: state.id
    }

    // every clinic has a site, RRT device and a user assigned to it
    const siteData = Object.assign({
      partnerId,
      name: `${state.name} Lab`,
      shortname: `L: ${state.name}`,
      externalId: `lab_${state.name}`,
      city: `${state.name} City`,
      street1: `${state.id} Main Street`,
      zip: `12345-${state.id}`
    }, geoData, auditFields)
    const [siteId] = yield knex('Site').insert(siteData)
    siteData.id = siteId

    // Router
    const [routerId] = yield knex('Device').insert(Object.assign({}, auditFields, {
      name: `Router at Lab ${siteData.name}`,
      shortname: 'r'+siteData.shortname,
      deviceTypeId: deviceTypes['Metacom Router'].id,
      siteId: siteData.id,
      createdOn: new Date(+now - 3*millisInHour),
      updatedOn: new Date(+now - millisInHour),
      lastPingOn: new Date(+now - millisInHour/3)
    }))
    yield knex('DeviceSim').insert(Object.assign({
      deviceId: routerId,
      provider: 'Vodafone',
      serial: 'SRL-' + routerId,
      number: '+1 413 123 45' + routerId
    }, auditFields))

    // RRT Terminal
    yield knex('Device').insert(Object.assign({
      name: `m2000 at ${siteData.name}`,
      shortname: 'd'+siteData.shortname,
      deviceTypeId: deviceTypes['m2000'].id,
      siteId: siteData.id,
      deviceId: routerId,
      createdOn: new Date(+now - 3*millisInHour),
      updatedOn: new Date(+now - millisInHour),
      lastPingOn: new Date(+now - millisInHour/3)
    }, auditFields))
  }
}

function rowsAsObject(knex, table, column='name'){
  return knex(table)
    .reduce((memo, row) => {
      memo[row[column]] = row
      return memo
    }, {})
}
