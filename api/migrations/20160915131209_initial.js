module.exports = require('../src/db').migration(up, down)

function* up(knex){

  yield knex.raw('SET foreign_key_checks = 0')

  yield knex.schema.createTable('PartnerType', pt => {
    pt.increments('id')
    pt.string('name').notNullable()
  })

  yield knex.schema.createTable('Partner', partner => {
    partner.increments('id')
    partner.integer('partnerTypeId').unsigned().notNullable()
      .index().references('id').inTable('PartnerType')
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
    user.boolean('approved').notNullable()
    user.dateTime('lastActive')
    user.dateTime('lastLogin')
    user.dateTime('lastPasswordChange')
    user.dateTime('createdOn').notNullable()
    user.boolean('lockedOut').notNullable()
    user.integer('failedPasswordAttempts').unsigned().notNullable()
    user.boolean('legacyPassword').notNullable().defaultTo(0)
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
    person.string('zip', 45)
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

  yield knex.schema.createTable('DeviceType', deviceType => {
    deviceType.increments('id')
    deviceType.string('name').notNullable()
    deviceType.charset('utf8')
    // TODO add device_type id1 - id4_query or appropriate alternative
    // used to uniquely identify devices and still to be discussed
  })

  yield knex.schema.createTable('Site', site => {
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
    site.string('timezoneId', 45)
    site.integer('hoursStart')
    site.integer('hoursEnd')
    addCreateFields(site)
    addUpdateFields(site)
    site.charset('utf8')
  })

  yield knex.schema.createTable('Device', device => {
    device.increments('id')
    device.integer('deviceTypeId').unsigned().notNullable()
      .index().references('id').inTable('DeviceType')

    // TODO Add device id1 - id4 or equivalent
    // used to uniquely identify provisioned devices, still to be discussed
    device.string('serial')
    device.string('hostId')
    device.string('computerId')
    device.integer('siteId').unsigned().notNullable()
      .index().references('id').inTable('Site')
    device.string('name').notNullable()
    device.string('shortname', 45)
    device.string('notes', 1200)
    device.boolean('hideOnDashboard')
    device.dateTime('lastPingOn')
    device.string('lastPingFrom', 45)
    device.string('computerCulture', 45)
    device.string('computerOs')
    device.string('computerTimezone', 45)
    device.dateTime('lastCalibrated')
    device.dateTime('putInService')
    device.string('putInServiceSource')
    // TODO add db and lis fields to "Operational Data" model
    //device.string('dbVersion', 45)
    //device.boolean('dbOk', 45)
    //device.string('lisConfig', 1200)
    //device.boolean('lisOk', 4)
    device.dateTime('dailyDetailsOn')
    device.string('aspectClientVersion', 45)
    device.boolean('customFieldsEnabled')
    device.dateTime('customFieldsSentOn')
    device.boolean('customFieldsEnabledOnDevice')
    device.boolean('approved')
    device.dateTime('approvedOn')
    device.integer('approvedBy').unsigned()
      .index().references('id').inTable('User')
    addCreateFields(device)
    addUpdateFields(device)
    device.charset('utf8')
  })

  yield knex.schema.createTable('DeviceSiteHistory', history => {
    history.integer('deviceId').unsigned().notNullable()
      .index().references('id').inTable('Device')
    history.integer('siteId').unsigned().notNullable()
      .index().references('id').inTable('Site')
    addCreateFields(history)
    history.primary(['deviceId', 'siteId'])
    history.charset('utf8')
  })

  yield knex.schema.createTable('Router', router => {
    router.increments('id')
    router.integer('siteId').unsigned().notNullable()
      .index().references('id').inTable('Site')
    router.string('number', 45)
    // TODO worth creating a SIM card table and changing
    // to sim_1 and sim_2?  (or many to many?)
    router.string('simRegNumber', 45)
    router.string('simRegNumber2', 45)
    router.string('simPhoneNumber', 45)
    router.string('simPhoneNumber2', 45)
    router.string('simProvider', 45)
    router.string('simProvider2', 45)
    router.string('simSuffix', 45)
    router.string('simSuffix2', 45)
    router.string('simPrefix', 45)
    router.string('simPrefix2', 45)
    addCreateFields(router)
    addUpdateFields(router)
    router.charset('utf8')
  })

  yield knex.schema.createTable('AssayType', assayType => {
    assayType.increments('id')
    assayType.string('name').notNullable()
    assayType.charset('utf8')
  })

  yield knex.schema.createTable('Assay', assay => {
    assay.increments('id')
    assay.string('name').notNullable()
    assay.integer('assayTypeId').unsigned().notNullable()
      .index().references('id').inTable('AssayType')
    assay.charset('utf8')
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

  yield knex.schema.dropTableIfExists('Assay')
  yield knex.schema.dropTableIfExists('AssayType')
  yield knex.schema.dropTableIfExists('Router')
  yield knex.schema.dropTableIfExists('DeviceSiteHistory')
  yield knex.schema.dropTableIfExists('Device')
  yield knex.schema.dropTableIfExists('Site')
  yield knex.schema.dropTableIfExists('DeviceType')
  yield knex.schema.dropTableIfExists('RefreshToken')
  yield knex.schema.dropTableIfExists('UserRole')
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
  yield knex.schema.dropTableIfExists('PartnerType')

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
