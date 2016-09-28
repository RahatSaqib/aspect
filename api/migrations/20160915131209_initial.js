module.exports = require('../src/db').migration(up, down)

function* up(knex){

  yield knex.raw('SET foreign_key_checks = 0')

  yield knex.schema.createTable('Partner', partner => {
    partner.increments('id')
    partner.string('name').notNullable()
  })

  yield knex.schema.createTable('OrgUnit', orgUnit => {
    orgUnit.increments('id')
    orgUnit.string('name').notNullable()
    orgUnit.integer('partnerId').unsigned().notNullable()
      .index().references('id').inTable('Partner')

    orgUnit.integer('leftBound').unsigned().notNullable()
    orgUnit.integer('rightBound').unsigned().notNullable()
    orgUnit.integer('depth').unsigned().notNullable()

    // TODO Add OrgUnit parent id if is helpful
    //orgUnit.integer('parentId').unsigned()
    //  .index().references('id').inTable('OrgUnit')
  })

  yield knex.schema.createTable('data_filter', dataFilter => {
    dataFilter.increments('id')
    dataFilter.string('name').notNullable()
    // knex does not yet support JSON for MySQL
    // dataFilter.json('constraint')
    dataFilter.specificType('constraint', 'JSON').notNullable()
  })

  yield knex.schema.createTable('user', user => {
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
    // TODO move to culture/locale table using name "en-US" as primary key
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
    // TODO should we move to geography table and share with site?
    person.integer('country_id').unsigned()
      .index().references('id').inTable('country')
    person.integer('state_id').unsigned()
      .index().references('id').inTable('state')
    person.integer('lga_id').unsigned()
      .index().references('id').inTable('lga')
    person.string('notes', 1200)
    person.integer('lastPartnerId').unsigned()
      .index().references('id').inTable('Partner')
    person.integer('last_country_id').unsigned()
      .index().references('id').inTable('country')
    // TODO timezone table?
    person.string('timezone')
    // TODO should user prefrences be stored in separate table?
    person.boolean('hide_patient_id')
    person.boolean('hide_sample_id')
    person.boolean('hide_notes')
    person.string('culture', 45)
    person.dateTime('accepted_license_on')
    addCreateFields(person)
    addUpdateFields(person)
    person.charset('utf8')
  })

  yield knex.schema.createTable('role', role => {
    role.increments('id')
    role.string('name').notNullable()
    role.integer('partnerId').unsigned()
      .index().references('id').inTable('Partner')
    role.integer('data_filter_id').unsigned()
      .index().references('id').inTable('data_filter')
    role.integer('orgUnitId').unsigned()
      .index().references('id').inTable('OrgUnit')
    role.charset('utf8')
  })

  yield knex.schema.createTable('permission', permission => {
    permission.increments('id')

    // e.g. clinical, inventory, operational, device, etc.
    permission.string('module').notNullable()
    // e.g.: view, edit, admin, view:aggregate, view:historical etc
    permission.string('activity').notNullable()

    // Since permissions are static, UI labels can be created programmatically
    permission.charset('utf8')
  })

  yield knex.schema.createTable('role_permission', permissionRole => {
    permissionRole.integer('role_id').unsigned()
      .index().references('id').inTable('role')
    permissionRole.integer('permission_id').unsigned()
      .index().references('id').inTable('permission')
    permissionRole.primary(['permission_id', 'role_id'])
    permissionRole.charset('utf8')
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
    deviceType.charset('utf8')
    // TODO add device_type id1 - id4_query or appropriate alternative
    // used to uniquely identify devices and still to be discussed
  })

  yield knex.schema.createTable('site', site => {
    site.increments('id')
    site.string('name').notNullable()
    site.string('shortname', 45)
    site.string('identifier')
    site.string('notes', 2000)
    // TODO is site to partner many to many?
    site.integer('partnerId').unsigned()
      .index().references('id').inTable('Partner')
    site.integer('orgUnitId').unsigned()
      .index().references('id').inTable('OrgUnit')
    site.integer('country_id').unsigned()
      .index().references('id').inTable('country')
    site.integer('state_id').unsigned()
      .index().references('id').inTable('state')
    site.integer('lga_id').unsigned()
      .index().references('id').inTable('lga')
    site.charset('utf8')
    // TODO do we want to mess with a city table?
    site.string('city')
    site.string('street1')
    site.string('street2')
    site.string('zip', 45)
    site.float('longitude', 10, 6)
    site.float('latitude', 10, 6)
    site.string('timezone_id', 45)
    site.integer('hours_start')
    site.integer('hours_end')
    addCreateFields(site)
    addUpdateFields(site)
    site.charset('utf8')
  })

  yield knex.schema.createTable('device', device => {
    device.increments('id')
    device.integer('device_type_id').unsigned().notNullable()
      .index().references('id').inTable('device_type')

    // TODO Add device id1 - id4 or equivalent
    // used to uniquely identify provisioned devices, still to be discussed
    device.string('serial')
    device.string('host_id')
    device.string('computer_id')
    device.integer('site_id').unsigned().notNullable()
      .index().references('id').inTable('site')
    device.string('name').notNullable()
    device.string('shortname', 45)
    device.string('notes', 1200)
    device.boolean('hide_on_dashboard')
    device.dateTime('last_ping_on')
    device.string('last_ping_from', 45)
    device.string('computer_culture', 45)
    device.string('computer_os')
    device.string('computer_timezone', 45)
    device.dateTime('last_calibrated')
    device.dateTime('put_in_service')
    device.string('put_in_service_source')
    // TODO add db and lis fields to "Operational Data" model
    //device.string('db_version', 45)
    //device.boolean('db_ok', 45)
    //device.string('lis_config', 1200)
    //device.boolean('lis_ok', 4)
    device.dateTime('daily_details_on')
    device.string('aspect_client_version', 45)
    device.boolean('custom_fields_enabled')
    device.dateTime('custom_fields_sent_on')
    device.boolean('custom_fields_enabled_on_device')
    device.boolean('approved')
    device.dateTime('approved_on')
    device.integer('approved_by').unsigned()
      .index().references('id').inTable('user')
    addCreateFields(device)
    addUpdateFields(device)
    device.charset('utf8')
  })

  yield knex.schema.createTable('device_site_history', history => {
    history.integer('device_id').unsigned().notNullable()
      .index().references('id').inTable('device')
    history.integer('site_id').unsigned().notNullable()
      .index().references('id').inTable('site')
    addCreateFields(history)
    history.primary(['device_id', 'site_id'])
    history.charset('utf8')
  })

  yield knex.schema.createTable('router', router => {
    router.increments('id')
    router.integer('site_id').unsigned().notNullable()
      .index().references('id').inTable('site')
    router.string('number', 45)
    // TODO worth creating a SIM card table and changing
    // to sim_1 and sim_2?  (or many to many?)
    router.string('sim_reg_number', 45)
    router.string('sim_reg_number_2', 45)
    router.string('sim_phone_number', 45)
    router.string('sim_phone_number_2', 45)
    router.string('sim_provider', 45)
    router.string('sim_provider_2', 45)
    router.string('sim_suffix', 45)
    router.string('sim_suffix_2', 45)
    router.string('sim_prefix', 45)
    router.string('sim_prefix_2', 45)
    addCreateFields(router)
    addUpdateFields(router)
    router.charset('utf8')
  })

  yield knex.raw('SET foreign_key_checks = 1')
}

function* down(knex){
  yield knex.raw('SET foreign_key_checks = 0')

  yield knex.schema.dropTableIfExists('router')
  yield knex.schema.dropTableIfExists('device_site_history')
  yield knex.schema.dropTableIfExists('device')
  yield knex.schema.dropTableIfExists('site')
  yield knex.schema.dropTableIfExists('device_type')
  yield knex.schema.dropTableIfExists('refresh_token')
  yield knex.schema.dropTableIfExists('user_role')
  yield knex.schema.dropTableIfExists('role_permission')
  yield knex.schema.dropTableIfExists('permission')
  yield knex.schema.dropTableIfExists('role')
  yield knex.schema.dropTableIfExists('person')
  yield knex.schema.dropTableIfExists('lga')
  yield knex.schema.dropTableIfExists('state')
  yield knex.schema.dropTableIfExists('country')
  yield knex.schema.dropTableIfExists('user')
  yield knex.schema.dropTableIfExists('data_filter')
  yield knex.schema.dropTableIfExists('org_unit')
  yield knex.schema.dropTableIfExists('partner')

  yield knex.schema.dropTableIfExists('OrgUnit')
  yield knex.schema.dropTableIfExists('Partner')

  yield knex.raw('SET foreign_key_checks = 1')
}


// Adds created_on, created_by
function addCreateFields(table){
  table.dateTime('created_on').notNullable()
  table.integer('created_by').unsigned().notNullable()
    .index().references('id').inTable('user')
}

// Adds update_on, updated_by
function addUpdateFields(table){
  table.dateTime('updated_on').notNullable()
  table.integer('updated_by').unsigned().notNullable()
    .index().references('id').inTable('user')
}
