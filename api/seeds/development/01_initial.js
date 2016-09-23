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
  let [partnerOneId] = yield knex('partner').insert({
    name: 'Partner One'
  })

  let [partnerTwoId] = yield knex('partner').insert({
    name: 'Partner Two'
  })

  let [partnerOneOrgUnitId] = yield knex('org_unit').insert({
    name: 'Partner One',
    partner_id: partnerOneId,
    depth: 1,
    left_bound: 1,
    right_bound: 6
  })

  let [regionNortheastId] = yield knex('org_unit').insert({
    name: 'Northeast',
    partner_id: partnerOneId,
    depth: 2,
    left_bound: 2,
    right_bound: 3
  })

  let [regionMidwestId] = yield knex('org_unit').insert({
    name: 'Midwest',
    partner_id: partnerOneId,
    depth: 2,
    left_bound: 4,
    right_bound: 5
  })

  // Create permissions
  let modules = {}
  for(let module of permissions.modules){
    let moduleData = {}
    modules[module.name] = moduleData
    for(let activity of module.activities){
      let [permissionId] = yield knex('permission').insert({
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
            partner_id: partnerOneId,
            org_unit_id: orgUnitId,
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
      last_partner_id: lastPartnerId,
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
  let [dataFilterIdOH] = yield knex('data_filter').insert({
    name: 'Ohio Filter',
    // TODO specify query constraint format (likely similar to MongoDB)
    constraint: JSON.stringify({
      state: {
        id: countries.US.states.OH.id
      }
    })
  })

  let [dataFilterIdNE] = yield knex('data_filter').insert({
    name: 'Nebraska Filter',
    constraint: JSON.stringify({
      state: {
        id: countries.US.states.NE.id
      }
    })
  })

  let [dataFilterIdOHWayne] = yield knex('data_filter').insert({
    name: 'Wayne County, OH Filter',
    constraint: JSON.stringify({
      lga: {
        id: countries.US.states.OH.lgas.Wayne.id
      }
    })
  })

  let [dataFilterIdMASuffolk] = yield knex('data_filter').insert({
    name: 'Suffolk County, MA Filter',
    constraint: JSON.stringify({
      lga: {
        id: countries.US.states.MA.lgas.Suffolk.id
      }
    })
  })

  // Roles
  let [roleIdAdmin] = yield knex('role').insert({
    name: 'Admin',
    partner_id: partnerOneId
  })

  let [roleIdOH] = yield knex('role').insert({
    name: 'Ohio Users',
    partner_id: partnerOneId,
    data_filter_id: dataFilterIdOH
  })

  let [roleIdNE] = yield knex('role').insert({
    name: 'Nebraska Users',
    partner_id: partnerOneId,
    data_filter_id: dataFilterIdNE
  })

  let [roleIdOHWayne] = yield knex('role').insert({
    name: 'Wayne County, OH Users',
    partner_id: partnerOneId,
    data_filter_id: dataFilterIdOHWayne
  })

  let [roleIdMASuffolk] = yield knex('role').insert({
    name: 'Suffolk County, MA Users',
    partner_id: partnerOneId,
    data_filter_id: dataFilterIdMASuffolk
  })

  let [roleIdParentOrgUnit] = yield knex('role').insert({
    name: 'Partner One Users',
    partner_id: partnerOneId,
    org_unit_id: partnerOneOrgUnitId
  })

  let [roleIdNortheast] = yield knex('role').insert({
    name: 'Northeast Users',
    partner_id: partnerOneId,
    org_unit_id: regionNortheastId
  })

  let [roleIdMidwest] = yield knex('role').insert({
    name: 'Midwest Users',
    partner_id: partnerOneId,
    org_unit_id: regionMidwestId
  })

  // assign permissions to roles
  yield knex('role_permission').insert([
    { role_id: roleIdAdmin, permission_id: modules.device.admin },
    { role_id: roleIdAdmin, permission_id: modules.person.admin },
    { role_id: roleIdAdmin, permission_id: modules.site.admin },

    { role_id: roleIdOH, permission_id: modules.site.edit },
    { role_id: roleIdOH, permission_id: modules.device.edit },

    { role_id: roleIdNE, permission_id: modules.site.edit },
    { role_id: roleIdNE, permission_id: modules.device.edit },

    { role_id: roleIdOHWayne, permission_id: modules.site.view },
    { role_id: roleIdOHWayne, permission_id: modules.device.view },

    { role_id: roleIdMASuffolk, permission_id: modules.device.view },

    { role_id: roleIdMidwest, permission_id: modules.site.edit },
    { role_id: roleIdMidwest, permission_id: modules.device.edit },

    { role_id: roleIdNortheast, permission_id: modules.site.edit },
    { role_id: roleIdNortheast, permission_id: modules.device.edit },

    { role_id: roleIdParentOrgUnit, permission_id: modules.site.edit },
    { role_id: roleIdParentOrgUnit, permission_id: modules.device.edit }
  ])


  // assign roles to users
  yield knex('user_role').insert([
    { user_id: userIds['admin'], role_id: roleIdAdmin },
    { user_id: userIds['bob'], role_id: roleIdOH },
    { user_id: userIds['ed'], role_id: roleIdMidwest },
    { user_id: userIds['frank'], role_id: roleIdNE },
    { user_id: userIds['fred'], role_id: roleIdOHWayne },
    { user_id: userIds['jon'], role_id: roleIdParentOrgUnit },
    { user_id: userIds['ned'], role_id: roleIdNortheast },
    { user_id: userIds['sam'], role_id: roleIdAdmin },
    { user_id: userIds['jim'], role_id: roleIdParentOrgUnit },
    { user_id: userIds['steve'], role_id: roleIdMASuffolk },
    { user_id: userIds['bill'], role_id: roleIdMASuffolk },
    { user_id: userIds['bill'], role_id: roleIdOH }])

}
