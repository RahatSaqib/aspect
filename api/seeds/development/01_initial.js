module.exports = require('../../src/db').seed(seed)

const _ = require('lodash')
const permissions = require('./fixtures/permissions.json')
const geography = require('./fixtures/geography.json')
const millisInHour = 1000*60*60
const deviceNumber = 50

function* seed(knex){
  // Create admin user and audit fields
  let now = new Date()
  let [adminId] = yield knex('user').insert({
    name: 'admin',
    password: 'mypassword',
    password_key: 'mykey',
    approved: 1,
    created_on: now,
    locked_out: 0,
    failed_password_attempts: 0
  })
  let auditFields = {
    created_on: now,
    created_by: adminId,
    updated_on: now,
    updated_by: adminId
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
      'abbreviation', 'name', 'a3', 'culture', 'country_code',
      'state_label', 'lga_label', 'timezone', 'port_number',
      'export_columns', 'inventory_days_threshold', 'month_starts_on_day'])
    let [countryId] = yield knex('country').insert(countryData)
    countryData.id = countryId
    countries[country.abbreviation] = countryData
    countryData.states = {}

    for(let state of (country.states || [])){
      let stateData = Object.assign(
        {country_id: countryData.id},
        _.pick(state, ['abbreviation', 'name']))
      let [stateId] = yield knex('state').insert(stateData)
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
          {state_id: stateData.id},
          _.pick(lga, ['name']))
        let [lgaId] = yield knex('lga').insert(lgaData)
        lgaData.id = lgaId
        stateData.lgas[lga.name] = lgaData
        lgaData.sites = {}

        let geoData = {
          country_id: countryData.id,
          state_id: stateData.id,
          lga_id: lgaData.id
        }
        geoDatas.push(geoData)

        // up to 5 of sites at each LGA
        for(let siteNumber of _.range(1, 6 - (lgaData.id % 5))){
          let siteData = Object.assign({
            partnerId: partnerOneId,
            orgUnitId,
            name: `${lga.name} ${country.lga_label} ${state.name} #${siteNumber}`,
            shortname: `${lga.name}, ${stateKey} #${siteNumber}`,
            identifier: `Site ${siteNumber * lgaData.id}`,
            city: `${lga.name} City`,
            street1: `${lgaData.id} Main Street`,
            zip: `12345-${lgaData.id}`
          }, geoData, auditFields)

          let [siteId] = yield knex('site').insert(siteData)
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
      [userId] = yield knex('user').insert({
        name: name.toLowerCase(),
        password: 'mypassword',
        password_key: 'mykey',
        approved: 1,
        created_on: now,
        locked_out: 0,
        failed_password_attempts: 0
      })
    }
    userIds[name.toLowerCase()] = userId

    let lastPartnerId = _.includes(['Jim', 'Jason'], name) ? partnerTwoId : partnerOneId
    let lastCountryId = _.includes(['Jim', 'Sam'], name) ? countries.NG.id : countries.US.id

    yield knex('person').insert(Object.assign({
      user_id: userId,
      name,
      lastPartnerId,
      last_country_id: lastCountryId
    }, geoDatas[geoDatas.length % userId], auditFields))
  }

  let [deviceTypeId] = yield knex('device_type').insert({
    name: 'GeneXpert'
  })

  let devices = _.range(1, deviceNumber+1).map(i => {
    let siteData = siteDatas[i % siteDatas.length]
    return Object.assign({}, auditFields, {
      name: `D${i} ${siteData.shortname}`,
      shortname: 'd'+i,
      device_type_id: deviceTypeId,
      site_id: siteData.id,
      created_on: new Date(+now - 3*i*millisInHour),
      updated_on: new Date(+now - i*millisInHour),
      last_ping_on: new Date(+now - i*millisInHour/3)
    })
  })
  yield knex('device').insert(devices)

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
    { roleId: roleIdAdmin, permissionId: modules.site.admin },

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
    { user_id: userIds['admin'], roleId: roleIdAdmin },
    { user_id: userIds['bob'], roleId: roleIdOH },
    { user_id: userIds['ed'], roleId: roleIdMidwest },
    { user_id: userIds['frank'], roleId: roleIdNE },
    { user_id: userIds['fred'], roleId: roleIdOHWayne },
    { user_id: userIds['jon'], roleId: roleIdParentOrgUnit },
    { user_id: userIds['ned'], roleId: roleIdNortheast },
    { user_id: userIds['sam'], roleId: roleIdAdmin },
    { user_id: userIds['jim'], roleId: roleIdParentOrgUnit },
    { user_id: userIds['steve'], roleId: roleIdMASuffolk },
    { user_id: userIds['bill'], roleId: roleIdMASuffolk },
    { user_id: userIds['bill'], roleId: roleIdOH }])

}
