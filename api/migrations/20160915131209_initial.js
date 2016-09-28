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

  yield knex.schema.createTable('DataFilter', dataFilter => {
    dataFilter.increments('id')
    dataFilter.string('name').notNullable()
    // knex does not yet support JSON for MySQL
    // dataFilter.json('constraint')
    dataFilter.specificType('constraint', 'JSON').notNullable()
  })

  yield knex.schema.createTable('User', user => {
    user.increments('id')
    user.string('name').unique().notNullable()
    user.string('password', 128).notNullable()
    user.string('passwordKey', 32).notNullable()
    user.boolean('approved').notNullable()
    user.dateTime('lastActive')
    user.dateTime('lastLogin')
    user.dateTime('lastPasswordChange')
    user.dateTime('createdOn').notNullable()
    user.boolean('lockedOut').notNullable()
    user.integer('failedPasswordAttempts').unsigned().notNullable()
    user.charset('utf8')
  })

  yield knex.schema.createTable('Country', country => {
    country.increments('id')
    country.string('name').notNullable()
    country.string('abbreviation', 10).notNullable()
    country.string('a3', 3)
    // TODO move to culture/locale table using name "en-US" as primary key
    country.string('culture', 5).notNullable()
    country.integer('countryCode')
    country.string('stateLabel')
    country.string('lgaLabel')
    country.string('timezone')
    country.string('portNumber')
    country.string('exportColumns', 2500).notNullable()
    country.string('tagPrefix', 45)
    country.string('tagRegexSampleId', 45)
    country.string('tagRegexPatientId ', 45)
    country.string('tagRegexNotes', 45)
    country.string('patientPhoneRegex', 100)
    country.string('notesSmsText', 1200)
    country.integer('inventoryDaysThreshold')
    country.string('testEqaRegex', 45)
    country.integer('monthStartsOnDay')
    country.integer('weekStartsOnDay ')
    country.charset('utf8')
  })

  yield knex.schema.createTable('State', state => {
    state.increments('id')
    state.integer('countryId').unsigned()
      .index().references('id').inTable('Country')
    state.string('name').notNullable()
    state.string('abbreviation', 10)
    state.charset('utf8')
  })

  yield knex.schema.createTable('Lga', lga => {
    lga.increments('id')
    lga.integer('stateId').unsigned()
      .index().references('id').inTable('State')
    lga.string('name').notNullable()
    lga.charset('utf8')
  })

  yield knex.schema.createTable('Person', person => {
    person.increments('id')
    person.integer('userId').unsigned()
      .index().references('id').inTable('User')
    person.string('name', 500).notNullable()
    person.string('title')
    person.string('email', 500)
    person.string('email2', 500)
    person.string('phone', 45)
    person.string('cell', 45)
    // TODO should we move to geography table and share with site?
    person.integer('countryId').unsigned()
      .index().references('id').inTable('Country')
    person.integer('stateId').unsigned()
      .index().references('id').inTable('State')
    person.integer('lgaId').unsigned()
      .index().references('id').inTable('Lga')
    person.string('notes', 1200)
    person.integer('lastPartnerId').unsigned()
      .index().references('id').inTable('Partner')
    person.integer('lastCountryId').unsigned()
      .index().references('id').inTable('Country')
    // TODO timezone table?
    person.string('timezone')
    // TODO should user prefrences be stored in separate table?
    person.boolean('hidePatientId')
    person.boolean('hideSampleId')
    person.boolean('hideNotes')
    person.string('culture', 45)
    person.dateTime('acceptedLicenseOn')
    addCreateFields(person)
    addUpdateFields(person)
    person.charset('utf8')
  })

  yield knex.schema.createTable('Role', role => {
    role.increments('id')
    role.string('name').notNullable()
    role.integer('partnerId').unsigned()
      .index().references('id').inTable('Partner')
    role.integer('dataFilterId').unsigned()
      .index().references('id').inTable('DataFilter')
    role.integer('orgUnitId').unsigned()
      .index().references('id').inTable('OrgUnit')
    role.charset('utf8')
  })

  yield knex.schema.createTable('Permission', permission => {
    permission.increments('id')

    // e.g. clinical, inventory, operational, device, etc.
    permission.string('module').notNullable()
    // e.g.: view, edit, admin, view:aggregate, view:historical etc
    permission.string('activity').notNullable()

    // Since permissions are static, UI labels can be created programmatically
    permission.charset('utf8')
  })

  yield knex.schema.createTable('RolePermission', permissionRole => {
    permissionRole.integer('roleId').unsigned()
      .index().references('id').inTable('Role')
    permissionRole.integer('permissionId').unsigned()
      .index().references('id').inTable('Permission')
    permissionRole.primary(['permissionId', 'roleId'])
    permissionRole.charset('utf8')
  })

  // FIXME Change UserRole to PersonRole
  yield knex.schema.createTable('UserRole', userRole => {
    userRole.integer('userId').unsigned()
      .index().references('id').inTable('User')
    userRole.integer('roleId').unsigned()
      .index().references('id').inTable('Role')
    userRole.primary(['userId', 'roleId'])
    userRole.charset('utf8')
  })

  yield knex.schema.createTable('RefreshToken', refreshToken => {
    refreshToken.integer('userId').unsigned().notNullable()
      .references('id').inTable('User')
    refreshToken.string('clientId', 128).notNullable()
    refreshToken.string('clientName').notNullable()
    refreshToken.string('token').notNullable()
    refreshToken.dateTime('expires').notNullable()
    refreshToken.boolean('revoked').notNullable().defaultTo(0)
    refreshToken.dateTime('createdOn').notNullable()
    refreshToken.primary(['userId', 'clientId'])
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
    site.integer('countryId').unsigned()
      .index().references('id').inTable('Country')
    site.integer('stateId').unsigned()
      .index().references('id').inTable('State')
    site.integer('lgaId').unsigned()
      .index().references('id').inTable('Lga')
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
      .index().references('id').inTable('User')
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

  yield knex.schema.dropTableIfExists('RefreshToken')
  yield knex.schema.dropTable('UserRole')
  yield knex.schema.dropTableIfExists('RolePermission')
  yield knex.schema.dropTableIfExists('Permission')
  yield knex.schema.dropTableIfExists('Role')
  yield knex.schema.dropTableIfExists('Person')
  yield knex.schema.dropTableIfExists('Lga')
  yield knex.schema.dropTableIfExists('State')
  yield knex.schema.dropTableIfExists('Country')
  yield knex.schema.dropTableIfExists('User')
  yield knex.schema.dropTableIfExists('DataFilter')
  yield knex.schema.dropTableIfExists('OrgUnit')
  yield knex.schema.dropTableIfExists('Partner')

  yield knex.raw('SET foreign_key_checks = 1')
}


// Adds createdOn, createdBy
function addCreateFields(table){
  table.dateTime('createdOn').notNullable()
  table.integer('createdBy').unsigned().notNullable()
    .index().references('id').inTable('User')
}

// Adds updatedOn, updatedBy
function addUpdateFields(table){
  table.dateTime('updatedOn').notNullable()
  table.integer('updatedBy').unsigned().notNullable()
    .index().references('id').inTable('User')
}
