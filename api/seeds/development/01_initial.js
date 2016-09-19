module.exports = require('../../src/db').seed(seed)

const _ = require('lodash')
const geography = require('./fixtures/geography.json')
const millisInHour = 1000*60*60
const deviceNumber = 50

function* seed(knex){
  // Create admin user and audit fields
  let now = new Date()
  let adminId = yield knex('user').insert({
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


  // Create geographic hierarchy
  let geoDatas = []
  let siteIds = []
  for(let country of geography.countries){
    let countryData = _.pick(country, [
      'abbreviation', 'name', 'a3', 'culture', 'country_code',
      'state_label', 'lga_label', 'timezone', 'port_number',
      'export_columns', 'inventory_days_threshold', 'month_starts_on_day'])
    countryData.id = yield knex('country').insert(countryData)

    for(let state of (country.states || [])){
      let stateData = Object.assign(
        {country_id: countryData.id},
        _.pick(state, ['abbreviation', 'name']))
      stateData.id = yield knex('state').insert(stateData)

      for(let lga of (state.lgas || [])){
        let lgaData = Object.assign(
          {state_id: stateData.id},
          _.pick(lga, ['name']))
        lgaData.id = yield knex('lga').insert(lgaData)

        let geoData = {
          country_id: countryData.id,
          state_id: stateData.id,
          lga_id: lgaData.id
        }
        geoDatas.push(geoData)

        // up to 5 of sites at each LGA
        for(let siteNumber of _.range(1, 6 - (lgaData.id % 5))){
          let siteData = Object.assign({
            name: `${lga.name} ${country.lga_label} ${state.name} #${siteNumber}`,
            shortname: `${lga.name} Site`,
            identifier: `Site ${siteNumber * lgaData.id}`,
            city: `${lga.name} City`,
            street1: `${lgaData.id} Main Street`,
            zip: `12345-${lgaData.id}`
          }, geoData, auditFields)

          siteData.id = yield knex('site').insert(siteData)
          siteIds.push(siteData.id)
        }
      }
    }
  }

  for(let name of ['Admin', 'Bob', 'Frank', 'Fred', 'Steve']){
    let userId
    if(name == 'Admin'){
      userId = adminId
    } else {
      userId = yield knex('user').insert(Object.assign({
        name: name.toLowerCase(),
        password: 'mypassword',
        password_key: 'mykey',
        approved: 1,
        created_on: now,
        locked_out: 0,
        failed_password_attempts: 0
      }))
    }

    yield knex('person').insert(Object.assign({
      user_id: userId,
      name: name
    }, geoDatas[geoDatas.length % userId], auditFields))
  }

  let deviceTypeId = yield knex('device_type').insert({
    name: 'GeneXpert'
  })

  let devices = _.range(1, deviceNumber+1).map(i => (
    Object.assign({}, auditFields, {
      name: 'Device '+i,
      shortname: 'd'+i,
      device_type_id: deviceTypeId,
      site_id: siteIds[i % siteIds.length],
      created_on: new Date(+now - 3*i*millisInHour),
      updated_on: new Date(+now - i*millisInHour),
      last_ping_on: new Date(+now - i*millisInHour/3)
    })))
  yield knex('device').insert(devices)
}
