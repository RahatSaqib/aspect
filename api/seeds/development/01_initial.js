module.exports = require('../../db').seed(seed)

const _ = require('lodash')
const millisInHour = 1000*60*60
const siteNumber = 10
const deviceNumber = 50

function* seed(knex){
  let now = new Date()
  let adminId = 1
  let auditFields = {}

  yield knex('country').insert({
    name: 'United States',
    abbreviation: 'US',
    a3: 'USA',
    culture: 'en-US',
    country_code: '1',
    state_label: 'State',
    lga_label: 'County',
    timezone: 'Eastern Standard Time',
    port_number: 3000,
    export_columns: 'DeploymentDescription|TestEndedOn|AssayName|AssayVersion|User|Result1|Result2|ReagentLotID|ExpirationDate|CartridgeSerial|ModuleSerial|SoftwareVersion|ErrorCode|ErrorCategory|ErrorDescription|SampleId|Notes',
    inventory_days_threshold: 21,
    month_starts_on_day: 1
  })

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
