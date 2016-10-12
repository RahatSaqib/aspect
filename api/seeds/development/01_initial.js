module.exports = require('../../src/db').seed(seed)

let config = require('../../src/config')
const _ = require('lodash')
const bcrypt = require('bcrypt')
const permissions = require('./fixtures/permissions.json')
const geography = require('./fixtures/geography.json')
const millisInHour = 1000*60*60
const deviceNumber = 50
const saltRounds = parseInt(config.passwordSaltRounds)

function* seed(knex){
  // Create admin user and audit fields
  let now = new Date()
  let [adminId] = yield knex('User').insert({
    name: 'admin',
    password: bcrypt.hashSync('test07', saltRounds),
    approved: 1,
    createdOn: now,
    lockedOut: 0,
    failedPasswordAttempts: 0
  })
  let auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId
  }

  // Create partners
  let [partnerOneId] = yield knex('Partner').insert({
    name: 'Partner One'
  })

  let [partnerTwoId] = yield knex('Partner').insert({
    name: 'Partner Two'
  })

  let [partnerOneOrgUnitId] = yield knex('OrgUnit').insert({
    name: 'Partner One',
    partnerId: partnerOneId,
    depth: 1,
    leftBound: 1,
    rightBound: 6
  })

  let [regionNortheastId] = yield knex('OrgUnit').insert({
    name: 'Northeast',
    partnerId: partnerOneId,
    depth: 2,
    leftBound: 2,
    rightBound: 3
  })

  let [regionMidwestId] = yield knex('OrgUnit').insert({
    name: 'Midwest',
    partnerId: partnerOneId,
    depth: 2,
    leftBound: 4,
    rightBound: 5
  })

  // Create permissions
  let modules = {}
  for(let module of permissions.modules){
    let moduleData = {}
    modules[module.name] = moduleData
    for(let activity of module.activities){
      let [permissionId] = yield knex('Permission').insert({
        module: module.name,
        activity
      })
      moduleData[activity] = permissionId
    }
  }

  // Create geographic hierarchy
  let countries = {}
  let geoDatas = []
  let siteDatas = []
  for(let country of geography.countries){
    let countryData = _.pick(country, [
      'abbreviation', 'name', 'a3', 'culture', 'countryCode',
      'stateLabel', 'lgaLabel', 'timezone', 'portNumber',
      'exportColumns', 'inventoryDaysThreshold', 'monthStartsOnDay'])
    let [countryId] = yield knex('Country').insert(countryData)
    countryData.id = countryId
    countries[country.abbreviation] = countryData
    countryData.states = {}

    for(let state of (country.states || [])){
      let stateData = Object.assign(
        {countryId: countryData.id},
        _.pick(state, ['abbreviation', 'name']))
      let [stateId] = yield knex('State').insert(stateData)
      stateData.id = stateId
      let stateKey = state.abbreviation || state.name
      countryData.states[stateKey] = stateData
      stateData.lgas = {}

      // assign org units based on state region
      let orgUnitId = _.includes(['OH', 'NE'], state.abbreviation) ? regionMidwestId
        : _.includes(['MA', 'NY'], state.abbreviation) ? regionNortheastId
        : partnerOneOrgUnitId

      for(let lga of (state.lgas || [])){
        let lgaData = Object.assign(
          {stateId: stateData.id},
          _.pick(lga, ['name']))
        let [lgaId] = yield knex('Lga').insert(lgaData)
        lgaData.id = lgaId
        stateData.lgas[lga.name] = lgaData
        lgaData.sites = {}

        let geoData = {
          countryId: countryData.id,
          stateId: stateData.id,
          lgaId: lgaData.id
        }
        geoDatas.push(geoData)

        // up to 5 of sites at each LGA
        for(let siteNumber of _.range(1, 6 - (lgaData.id % 5))){
          let siteData = Object.assign({
            partnerId: partnerOneId,
            orgUnitId,
            name: `${lga.name} ${country.lgaLabel} ${state.name} #${siteNumber}`,
            shortname: `${lga.name}, ${stateKey} #${siteNumber}`,
            identifier: `Site ${siteNumber * lgaData.id}`,
            city: `${lga.name} City`,
            street1: `${lgaData.id} Main Street`,
            zip: `12345-${lgaData.id}`
          }, geoData, auditFields)

          let [siteId] = yield knex('Site').insert(siteData)
          siteData.id = siteId
          siteDatas.push(siteData)
        }
      }
    }
  }

  // Users
  let userIds = {}
  for(let name of ['Admin', 'Bill', 'Bob', 'Frank', 'Ed', 'Fred',
      'Jason', 'Jim', 'Jon', 'Ned', 'Sam', 'Steve']){
    let userId
    if(name === 'Admin'){
      userId = adminId
    } else {
      [userId] = yield knex('User').insert({
        name: name.toLowerCase(),
        // User "Bill" was migrated from a GxAlert database.
        // Set pw to something that doesn't look like a bcrypt hash
        // so that Gx API is used to verify pw and set on aspect
        password: name === 'Bill' ? 'Migrated from GxAlert' : bcrypt.hashSync('test07', saltRounds),
        approved: 1,
        createdOn: now,
        lockedOut: 0,
        failedPasswordAttempts: 0
      })
    }
    userIds[name.toLowerCase()] = userId

    let lastPartnerId = _.includes(['Jim', 'Jason'], name) ? partnerTwoId : partnerOneId
    let lastCountryId = _.includes(['Jim', 'Sam'], name) ? countries.NG.id : countries.US.id

    yield knex('Person').insert(Object.assign({
      userId,
      name,
      lastPartnerId,
      lastCountryId
    }, geoDatas[geoDatas.length % userId], auditFields))
  }

  let [deviceTypeId] = yield knex('DeviceType').insert({
    name: 'GeneXpert'
  })

  let devices = _.range(1, deviceNumber+1).map(i => {
    let siteData = siteDatas[i % siteDatas.length]
    return Object.assign({}, auditFields, {
      name: `D${i} ${siteData.shortname}`,
      shortname: 'd'+i,
      deviceTypeId,
      siteId: siteData.id,
      createdOn: new Date(+now - 3*i*millisInHour),
      updatedOn: new Date(+now - i*millisInHour),
      lastPingOn: new Date(+now - i*millisInHour/3)
    })
  })
  yield knex('Device').insert(devices)

  // data filters
  let [dataFilterIdOH] = yield knex('DataFilter').insert({
    name: 'Ohio Filter',
    // TODO specify query constraint format (likely similar to MongoDB)
    constraint: JSON.stringify({
      state: {
        id: countries.US.states.OH.id
      }
    })
  })

  let [dataFilterIdNE] = yield knex('DataFilter').insert({
    name: 'Nebraska Filter',
    constraint: JSON.stringify({
      state: {
        id: countries.US.states.NE.id
      }
    })
  })

  let [dataFilterIdOHWayne] = yield knex('DataFilter').insert({
    name: 'Wayne County, OH Filter',
    constraint: JSON.stringify({
      lga: {
        id: countries.US.states.OH.lgas.Wayne.id
      }
    })
  })

  let [dataFilterIdMASuffolk] = yield knex('DataFilter').insert({
    name: 'Suffolk County, MA Filter',
    constraint: JSON.stringify({
      lga: {
        id: countries.US.states.MA.lgas.Suffolk.id
      }
    })
  })

  // Roles
  let [roleIdAdmin] = yield knex('Role').insert({
    name: 'Admin',
    partnerId: partnerOneId
  })

  let [roleIdOH] = yield knex('Role').insert({
    name: 'Ohio Users',
    partnerId: partnerOneId,
    dataFilterId: dataFilterIdOH
  })

  let [roleIdNE] = yield knex('Role').insert({
    name: 'Nebraska Users',
    partnerId: partnerOneId,
    dataFilterId: dataFilterIdNE
  })

  let [roleIdOHWayne] = yield knex('Role').insert({
    name: 'Wayne County, OH Users',
    partnerId: partnerOneId,
    dataFilterId: dataFilterIdOHWayne
  })

  let [roleIdMASuffolk] = yield knex('Role').insert({
    name: 'Suffolk County, MA Users',
    partnerId: partnerOneId,
    dataFilterId: dataFilterIdMASuffolk
  })

  let [roleIdParentOrgUnit] = yield knex('Role').insert({
    name: 'Partner One Users',
    partnerId: partnerOneId,
    orgUnitId: partnerOneOrgUnitId
  })

  let [roleIdNortheast] = yield knex('Role').insert({
    name: 'Northeast Users',
    partnerId: partnerOneId,
    orgUnitId: regionNortheastId
  })

  let [roleIdMidwest] = yield knex('Role').insert({
    name: 'Midwest Users',
    partnerId: partnerOneId,
    orgUnitId: regionMidwestId
  })

  // assign permissions to roles
  yield knex('RolePermission').insert([
    { roleId: roleIdAdmin, permissionId: modules.device.admin },
    { roleId: roleIdAdmin, permissionId: modules.person.admin },
    { roleId: roleIdAdmin, permissionId: modules.result.admin },
    { roleId: roleIdAdmin, permissionId: modules.site.admin },

    // FIXME: result permission for role

    { roleId: roleIdOH, permissionId: modules.site.edit },
    { roleId: roleIdOH, permissionId: modules.device.edit },

    { roleId: roleIdNE, permissionId: modules.site.edit },
    { roleId: roleIdNE, permissionId: modules.device.edit },

    { roleId: roleIdOHWayne, permissionId: modules.site.view },
    { roleId: roleIdOHWayne, permissionId: modules.device.view },

    { roleId: roleIdMASuffolk, permissionId: modules.device.view },

    { roleId: roleIdMidwest, permissionId: modules.site.edit },
    { roleId: roleIdMidwest, permissionId: modules.device.edit },

    { roleId: roleIdNortheast, permissionId: modules.site.edit },
    { roleId: roleIdNortheast, permissionId: modules.device.edit },

    { roleId: roleIdParentOrgUnit, permissionId: modules.site.edit },
    { roleId: roleIdParentOrgUnit, permissionId: modules.device.edit }
  ])


  // assign roles to users
  yield knex('UserRole').insert([
    { userId: userIds['admin'], roleId: roleIdAdmin },
    { userId: userIds['bob'], roleId: roleIdOH },
    { userId: userIds['ed'], roleId: roleIdMidwest },
    { userId: userIds['frank'], roleId: roleIdNE },
    { userId: userIds['fred'], roleId: roleIdOHWayne },
    { userId: userIds['jon'], roleId: roleIdParentOrgUnit },
    { userId: userIds['ned'], roleId: roleIdNortheast },
    { userId: userIds['sam'], roleId: roleIdAdmin },
    { userId: userIds['jim'], roleId: roleIdParentOrgUnit },
    { userId: userIds['steve'], roleId: roleIdMASuffolk },
    { userId: userIds['bill'], roleId: roleIdMASuffolk },
    { userId: userIds['bill'], roleId: roleIdOH }])

}
