module.exports = require('../../src/db').seed(seed)

const config = require('../../src/config')
const bcrypt = require('bcrypt')
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
  const nigeriaStates = yield knex('Country as c')
    .innerJoin('State as s', 'c.id', 's.countryId')
    .where({'c.a3': 'MWI'})
    .select('s.countryId', 's.id', 's.name')

  // Person for RRT Admin
  yield knex('Person').insert(Object.assign({
    userId: adminId,
    name: 'RRT Admin',
    lastPartnerId: partnerId,
    lastCountryId: nigeriaStates[0].countryId,
    countryId: nigeriaStates[0].countryId,
    stateId: nigeriaStates[0].stateId
  }, auditFields))

  for(let state of nigeriaStates){
    const geoData = {
      countryId: state.countryId,
      stateId: state.id
    }

    // every clinic has a site, RRT device and a user assigned to it
    const siteData = Object.assign({
      partnerId,
      name: `${state.name} Clinic`,
      shortname: `C: ${state.name}`,
      identifier: `I: ${state.name}`,
      city: `${state.name} City`,
      street1: `${state.id} Main Street`,
      zip: `12345-${state.id}`
    }, geoData, auditFields)
    const [siteId] = yield knex('Site').insert(siteData)
    siteData.id = siteId

    // User and person
    const [userId] = yield knex('User').insert({
      name: `rrt_${state.name}`.toLowerCase().replace(/\s+/, '_'),
      password: bcrypt.hashSync('test07', saltRounds),
      approved: 1,
      createdOn: now,
      lockedOut: 0,
      failedPasswordAttempts: 0
    })
    yield knex('Person').insert(Object.assign({
      userId,
      name: `RRT ${state.name}`,
      lastPartnerId: partnerId,
      lastCountryId: state.countryId
    }, geoData, auditFields))

    // Router
    let [routerId] = yield knex('Device').insert(Object.assign({}, auditFields, {
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
    yield knex('Device').insert(Object.assign({
      name: `RRT at ${siteData.name}`,
      shortname: 'd'+siteData.shortname,
      deviceTypeId: deviceTypes['RRT'].id,
      siteId: siteData.id,
      deviceId: routerId,
      createdOn: new Date(+now - 3*millisInHour),
      updatedOn: new Date(+now - millisInHour),
      lastPingOn: new Date(+now - millisInHour/3)
    }, auditFields))

    // Roles and permissions
    // TODO allow data filter on site and sample source site
    const [dataFilterId] = yield knex('DataFilter').insert({
      name: siteData.name+' Filter',
      constraint: JSON.stringify({
        site: {
          id: siteId
        }
      })
    })

    const [roleIdSite] = yield knex('Role').insert({
      name: siteData.name+' User',
      partnerId,
      dataFilterId: dataFilterId
    })

    yield knex('RolePermission').insert([
      { roleId: roleIdSite, permissionId: modules.device.edit }
    ])

    yield knex('UserRole').insert([
      { userId, roleId: roleIdSite }])
  }
}

function rowsAsObject(knex, table, column='name'){
  return knex(table)
    .reduce((memo, row) => {
      memo[row[column]] = row
      return memo
    }, {})
}
