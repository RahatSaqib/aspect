module.exports = require('../../src/db').seed(seed)

const _ = require('lodash')
const geography = require('./fixtures/geography.json')
const millisInHour = 1000*60*60
const siteNumber = 10
const deviceNumber = 50

function* seed(knex){
  let now = new Date()
  let adminId = 1
  let auditFields = {}

  for(let country of geography.countries){
    let countryId = yield knex('country').insert(_.pick(country, [
      'abbreviation', 'name', 'a3', 'culture', 'country_code',
      'state_label', 'lga_label', 'timezone', 'port_number',
      'export_columns', 'inventory_days_threshold', 'month_starts_on_day']))

    for(let state of (country.states || [])){
      let stateId = yield knex('state').insert(Object.assign(
        {country_id: countryId}, _.pick(state, ['abbreviation', 'name'])))

      for(let lga of (state.lgas || [])){
        yield knex('lga').insert(Object.assign(
          {state_id: stateId}, _.pick(lga, ['name'])))
      }
    }
  }

  for(let name of ['Admin', 'Bob', 'Frank', 'Fred', 'Steve']){
    let userId = yield knex('user').insert({
      name: name.toLowerCase(),
      password: 'mypassword',
      password_key: 'mykey',
      approved: 1,
      created_on: now,
      locked_out: 0,
      failed_password_attempts: 0
    })

    if(name == 'Admin'){
      adminId = userId
      auditFields = {
        created_on: now,
        created_by: adminId,
        updated_on: now,
        updated_by: adminId
      }
    }

    yield knex('person').insert(Object.assign({
      user_id: userId,
      name: name
    }, auditFields))
  }

  let deviceTypeId = yield knex('device_type').insert({
    name: 'GeneXpert'
  })

  let siteIds = []
  for(let i = 1; i < siteNumber + 1; i++){
    let siteId = yield knex('site').insert(Object.assign({
      name: 'Site '+i,
      shortname: 'l'+i,
      identifier: i*31
    }, auditFields))
    siteIds.push(siteId)
  }

  let devices = _.range(1, deviceNumber+1).map(i => (
    Object.assign({}, auditFields, {
      name: 'Device '+i,
      shortname: 'd'+i,
      device_type_id: deviceTypeId,
      site_id: siteIds[i % siteNumber],
      created_on: new Date(+now - 3*i*millisInHour),
      updated_on: new Date(+now - i*millisInHour),
      last_ping_on: new Date(+now - i*millisInHour/3)
    })))
  yield knex('device').insert(devices)
}
