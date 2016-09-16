module.exports = require('../db').migration(up, down)

function* up(knex){

  yield knex.schema.createTable('user', user => {
    // TODO should we switch to UUID for primary keys?
    user.increments('id')
    user.string('name').unique().notNullable()
    user.string('password', 128).notNullable()
    user.string('password_key', 32).notNullable()
    user.boolean('approved').notNullable()
    user.dateTime('last_active')
    user.dateTime('last_login')
    user.dateTime('last_password_change')
    user.dateTime('created_on').notNullable()
    user.boolean('locked_out').notNullable()
    user.integer('failed_password_attempts').unsigned().notNullable()
    user.charset('utf8')
  })

  yield knex.schema.createTable('country', country => {
    country.increments('id')
    country.string('name').notNullable()
    country.string('abbreviation', 10).notNullable()
    country.string('a3', 3)
    // TODO culture/locale table?
    country.string('culture', 5).notNullable()
    country.integer('country_code')
    country.string('state_label')
    country.string('lga_label')
    country.string('timezone')
    country.string('port_number')
    country.string('export_columns', 2500).notNullable()
    country.string('tag_prefix', 45)
    country.string('tag_regex_sampleId', 45)
    country.string('tag_regex_patientId ', 45)
    country.string('tag_regex_notes', 45)
    country.string('patient_phone_regex', 100)
    country.string('notes_sms_text', 1200)
    country.integer('inventory_days_threshold')
    country.string('test_eqa_regex', 45)
    country.integer('month_starts_on_day')
    country.integer('week_starts_on_day ')
    country.charset('utf8')
  })

  yield knex.schema.createTable('state', state => {
    state.increments('id')
    state.integer('country_id').unsigned()
      .index().references('id').inTable('country')
    state.string('name').notNullable()
    state.string('abbreviation', 10)
    state.charset('utf8')
  })

  yield knex.schema.createTable('lga', lga => {
    lga.increments('id')
    lga.integer('state_id').unsigned()
      .index().references('id').inTable('state')
    lga.string('name').notNullable()
    lga.charset('utf8')
  })

  // TODO person_level replaced by permissions?
  yield knex.schema.createTable('person_level', personLevel => {
    personLevel.increments('id')
    personLevel.string('name', 45).notNullable()
    personLevel.integer('sort_order')
    personLevel.string('token', 45).notNullable()
    personLevel.integer('level').notNullable()
    personLevel.charset('utf8')
  })

  yield knex.schema.createTable('person', person => {
    person.increments('id')
    person.integer('user_id').unsigned()
      .index().references('id').inTable('user')
    person.string('name', 500).notNullable()
    person.string('title')
    person.string('email', 500)
    person.string('email2', 500)
    person.string('phone', 45)
    person.string('cell', 45)
    // TODO should we move to location/geography table and share with site location?
    person.integer('country_id').unsigned()
      .index().references('id').inTable('country')
    person.integer('state_id').unsigned()
      .index().references('id').inTable('state')
    person.integer('lga_id').unsigned()
      .index().references('id').inTable('lga')
    person.integer('person_level_id').unsigned()
      .index().references('id').inTable('person_level')
    person.string('notes', 1200)
    person.integer('last_country_id').unsigned()
      .index().references('id').inTable('country')
    // TODO timezone table?
    person.string('timezone')
    person.boolean('hide_patient_id')
    person.boolean('hide_sample_id')
    person.boolean('hide_notes')
    // TODO same culture as country? (different lengths)
    person.string('culture', 10)
    person.dateTime('accepted_license_on')
    // TODO OK to change created_on and updated_on to _at and use knex.timestamps()?
    // TODO should we store created, updated user time on all tables and write util to manage automatically?
    person.dateTime('created_on').notNullable()
    // TODO why is this a varchar(255) is it a user_id?
    person.string('created_by').notNullable()
    person.dateTime('updated_on').notNullable()
    // TODO why is this a varchar(255) is it a user_id?
    person.string('updated_by').notNullable()
    person.charset('utf8')
  })

  yield knex.schema.createTable('role', role => {
    role.increments('id')
    role.string('name').notNullable()
    role.charset('utf8')
  })

  yield knex.schema.createTable('user_role', userRole => {
    userRole.integer('user_id').unsigned()
      .index().references('id').inTable('user')
    userRole.integer('role_id').unsigned()
      .index().references('id').inTable('role')
    userRole.primary(['user_id', 'role_id'])
    userRole.charset('utf8')
  })

  yield knex.schema.createTable('refresh_token', refreshToken => {
    refreshToken.integer('user_id').unsigned().notNullable()
      .references('id').inTable('user')
    // TODO should we add client table?
    refreshToken.string('client_id', 128).notNullable()
    refreshToken.string('client_name').notNullable()
    refreshToken.string('token').notNullable()
    refreshToken.dateTime('expires').notNullable()
    refreshToken.boolean('revoked').notNullable().defaultTo(0)
    refreshToken.dateTime('created_on').notNullable()
    refreshToken.primary(['user_id', 'client_id'])
    refreshToken.charset('utf8')
  })

  yield knex.schema.createTable('device_type', deviceType => {
    deviceType.increments('id')
    deviceType.string('name').notNullable()
    // TODO device_type id1 - id4_query??
    deviceType.charset('utf8')
  })

  yield knex.schema.createTable('location', location => {
    location.increments('id')
    location.string('name').notNullable()
    location.string('shortname', 45)
    location.string('identifier')
    location.string('notes', 2000)
    location.integer('country_id').unsigned()
      .index().references('id').inTable('country')
    location.integer('state_id').unsigned()
      .index().references('id').inTable('state')
    location.integer('lga_id').unsigned()
      .index().references('id').inTable('lga')
    location.charset('utf8')
    // TODO do we want to mess with a city table?
    location.string('city')
    location.string('street1')
    location.string('street2')
    location.string('zip', 45)
    location.float('longitude', 10, 6)
    location.float('latitude', 10, 6)
    location.string('timezone_id', 45)
    location.integer('hours_start')
    location.integer('hours_end')
    location.dateTime('created_on').notNullable()
    location.integer('created_by').unsigned().notNullable()
      .index().references('id').inTable('user')
    location.dateTime('updated_on').notNullable()
    location.integer('updated_by').unsigned().notNullable()
      .index().references('id').inTable('user')
    location.charset('utf8')
  })

  yield knex.schema.createTable('device', device => {
    device.increments('id')
    device.integer('device_type_id').unsigned().notNullable()
      .index().references('id').inTable('device_type')
    // TODO what are device id1 - id4?
    // `id1` varchar(255) DEFAULT NULL,
    device.string('serial')
    // TODO what is the device host ID and computer ID?
    device.string('host_id')
    device.string('computer_id')
    device.integer('location_id').unsigned().notNullable()
      .index().references('id').inTable('location')
    device.string('name').notNullable()
    device.string('shortname', 45)
    device.string('notes', 1200)
    device.boolean('hide_on_dashboard')
    device.dateTime('last_ping_on')
    device.string('last_ping_from', 45)
    // TODO computer culture same values as country and user culture?
    device.string('computer_culture', 45)
    device.string('computer_os')
    device.string('computer_timezone', 45)
    device.dateTime('last_calibrated')
    device.dateTime('put_in_service')
    // TODO what is put_in_service_source
    device.string('put_in_service_source')
    // TODO What is device db version/ok?
    device.string('db_version', 45)
    device.boolean('db_ok', 45)
    // TODO device lis config?
    device.string('lis_config', 1200)
    device.boolean('lis_ok', 4)
    device.dateTime('daily_details_on')
    device.string('aspect_client_version', 45)
    // TODO how to device custom fields work?
    device.boolean('custom_fields_enabled')
    device.dateTime('custom_fields_sent_on')
    device.boolean('custom_fields_enabled_on_device')
    device.boolean('approved')
    device.dateTime('approved_on')
    device.integer('approved_by').unsigned()
      .index().references('id').inTable('user')
    device.dateTime('created_on').notNullable()
    device.integer('created_by').unsigned().notNullable()
      .index().references('id').inTable('user')
    device.dateTime('updated_on').notNullable()
    device.integer('updated_by').unsigned().notNullable()
      .index().references('id').inTable('user')
    device.charset('utf8')
  })

  // TODO device_location_history
  // TODO what is form?
  // TODO are person_country _device _level _lga _location _state replaced with data groups/roles?
  // TODO router
  // TODO pivot_labotory procedure
}

function* down(knex){
  yield knex.schema.dropTable('device')
  yield knex.schema.dropTable('location')
  yield knex.schema.dropTable('device_type')
  yield knex.schema.dropTable('refresh_token')
  yield knex.schema.dropTable('user_role')
  yield knex.schema.dropTable('role')
  yield knex.schema.dropTable('person')
  yield knex.schema.dropTable('lga')
  yield knex.schema.dropTable('state')
  yield knex.schema.dropTable('country')
  yield knex.schema.dropTable('user')
}
