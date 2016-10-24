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

  yield knex.schema.createTable('DeviceTypeCategory', deviceTypeFeature => {
    deviceTypeFeature.increments('id')
    deviceTypeFeature.string('name').notNullable()
    deviceTypeFeature.boolean('hasConnectivity').notNullable().defaultTo(0)
    deviceTypeFeature.boolean('hasResults').notNullable().defaultTo(0)
    deviceTypeFeature.charset('utf8')
  })

  yield knex.schema.createTable('DeviceType', deviceType => {
    deviceType.increments('id')
    deviceType.integer('deviceTypeCategoryId').unsigned().notNullable()
      .references('id').inTable('DeviceTypeCategory')
    deviceType.string('name').notNullable()
    deviceType.string('manufacturer').notNullable()
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
    device.integer('deviceId').unsigned()
      .index().references('id').inTable('Device')
    device.integer('siteId').unsigned().notNullable()
      .index().references('id').inTable('Site')
    device.integer('deviceTypeId').unsigned().notNullable()
      .index().references('id').inTable('DeviceType')

    // current configuration and operation (history maintained with backref)
    device.integer('deviceConfigurationId').unsigned()
      .index().references('id').inTable('DeviceConfiguration')
    device.integer('deviceOperationId').unsigned()
      .index().references('id').inTable('DeviceOperation')

    // TODO Add device id1 - id4 or equivalent
    // used to uniquely identify provisioned devices, still to be discussed
    device.string('name').notNullable()
    device.string('shortname', 45)
    device.string('serial')
    device.string('hostId')
    device.string('notes', 1200)
    device.boolean('hideOnDashboard')
    device.dateTime('lastPingOn')
    device.string('lastPingFrom', 45)
    device.string('macAddress')
    device.string('culture', 45)
    device.string('operatingSystem')
    device.string('timezone', 45)
    device.dateTime('putInService')
    device.string('putInServiceSource')
    // TODO add db and lis fields to "Operational Data" model
    //device.string('dbVersion', 45)
    //device.boolean('dbOk', 45)
    //device.string('lisConfig', 1200)
    //device.boolean('lisOk', 4)
    device.dateTime('heartbeatOn')
    device.string('clientVersion', 45)
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

  yield knex.schema.createTable('DeviceSim', sim => {
    sim.increments('id')
    sim.integer('deviceId').unsigned().notNullable()
      .index().references('id').inTable('Device')
    sim.string('provider')
    sim.string('serial')
    sim.string('number')
    addCreateFields(sim)
    addUpdateFields(sim)
    sim.charset('utf8')
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

  yield knex.schema.createTable('DeviceConfiguration', config => {
    config.increments('id')
    config.integer('deviceId').unsigned().notNullable()
      .index().references('id').inTable('Device')
    config.specificType('data', 'JSON').notNullable()
    addCreateFields(config)
    config.charset('utf8')
  })

  yield knex.schema.createTable('DeviceOperation', config => {
    config.increments('id')
    config.integer('deviceId').unsigned().notNullable()
      .index().references('id').inTable('Device')
    config.specificType('data', 'JSON').notNullable()
    addCreateFields(config)
    config.charset('utf8')
  })

  yield knex.schema.createTable('AssayType', assayType => {
    assayType.increments('id')
    assayType.string('name').notNullable()
    assayType.string('i18nKey')
    assayType.charset('utf8')
  })

  yield knex.schema.createTable('Assay', assay => {
    assay.increments('id')
    assay.string('name').notNullable()
    assay.string('i18nKey')
    assay.integer('assayTypeId').unsigned().notNullable()
      .index().references('id').inTable('AssayType')
    assay.integer('deviceTypeId').unsigned().notNullable()
      .index().references('id').inTable('DeviceType')
    assay.string('resultCategory1Label')
    assay.string('resultCategory1i18nKey')
    assay.string('resultCategory2Label')
    assay.string('resultCategory2i18nKey')
    assay.specificType('resultDataSchema', 'JSON')
    assay.charset('utf8')
  })

  yield knex.schema.createTable('ResultType', resultType => {
    resultType.increments('id')
    resultType.string('name').notNullable()
    resultType.string('i18nKey')
    resultType.charset('utf8')
  })

  // holds general categories such as "Detected"/"Invalid"
  yield knex.schema.createTable('ResultCategory', resultCategory => {
    resultCategory.increments('id')
    resultCategory.string('name').notNullable()
    resultCategory.string('i18nKey')
    resultCategory.charset('utf8')
  })

  // which result categories apply to which assays?
  yield knex.schema.createTable('ResultCategoryAssay', resultTypeCategoryAssay => {
    resultTypeCategoryAssay.integer('resultCategoryId').unsigned().notNullable()
      .index().references('id').inTable('ResultCategory')
    resultTypeCategoryAssay.integer('assayId').unsigned().notNullable()
      .index().references('id').inTable('Assay')
    resultTypeCategoryAssay.unique(['resultCategoryId', 'assayId'])
  })

  // the sample that the result is based on (multiple results can refer to the same sample)
  yield knex.schema.createTable('Sample', sample => {
    sample.increments('id')
    sample.string('sampleId').notNullable()
    sample.integer('originSiteId').unsigned()
          .index().references('id').inTable('Site')
    sample.charset('utf8')
  })

  yield knex.schema.createTable('Result', result => {
    result.increments('id')
    result.string('uniqueId').notNullable()
    result.integer('assayId').unsigned().notNullable()
      .index().references('id').inTable('Assay')
    result.integer('partnerId').unsigned()
          .index().references('id').inTable('Partner')
    result.integer('orgUnitId').unsigned()
          .index().references('id').inTable('OrgUnit')
    result.integer('countryId').unsigned()
          .index().references('id').inTable('Country')
    result.integer('stateId').unsigned()
          .index().references('id').inTable('State')
    result.integer('lgaId').unsigned()
          .index().references('id').inTable('Lga')
    result.integer('siteId').unsigned()
          .index().references('id').inTable('Site')
    result.integer('deviceId').unsigned().notNullable()
          .index().references('id').inTable('Device')
    result.integer('resultTypeId').unsigned().notNullable()
      .index().references('id').inTable('ResultType')
    result.integer('sampleId').unsigned().notNullable()
      .index().references('id').inTable('Sample')
    result.string('resultText')
    result.integer('resultCategory1').unsigned()
      .index().references('id').inTable('ResultCategory')
    result.integer('resultCategory2').unsigned()
      .index().references('id').inTable('ResultCategory')
    result.specificType('resultData', 'JSON')
    result.string('assayVersion')
    result.dateTime('started')
    result.dateTime('ended').notNullable()
    result.string('consumableSerial')
    result.dateTime('consumableExpirationDate')
    result.string('consumableLot')
    result.string('instrumentSerial')
    result.string('moduleName')
    result.string('moduleSerial')
    result.string('researchId')
    result.string('patientId')
    result.string('senderVersion')
    result.string('senderOperator')
    result.string('notes')
    result.string('errorCode')
    result.string('errorNotes')
    addCreateFieldsNullable(result)
    addUpdateFieldsNullable(result)
    result.charset('utf8')
  })

  yield knex.schema.createTable('ResultLog', sample => {
    sample.increments('id')
    sample.integer('resultId').unsigned().notNullable()
          .index().references('id').inTable('Result')
    sample.string('source').notNullable() // LIS listener, API...
    sample.string('senderIp').notNullable()
    sample.text('rawMessage')
    sample.charset('utf8')
  })

  yield knex.raw('SET foreign_key_checks = 1')
}

function* down(knex){
  yield knex.raw('SET foreign_key_checks = 0')
  yield knex.schema.dropTableIfExists('ResultCategoryAssay')
  yield knex.schema.dropTableIfExists('ResultType')
  yield knex.schema.dropTableIfExists('ResultCategory')
  yield knex.schema.dropTableIfExists('ResultLog')
  yield knex.schema.dropTableIfExists('Result')
  yield knex.schema.dropTableIfExists('Sample')
  yield knex.schema.dropTableIfExists('Assay')
  yield knex.schema.dropTableIfExists('AssayType')
  yield knex.schema.dropTableIfExists('Router')
  yield knex.schema.dropTableIfExists('DeviceSiteHistory')
  yield knex.schema.dropTableIfExists('Device')
  yield knex.schema.dropTableIfExists('Site')
  yield knex.schema.dropTableIfExists('DeviceTypeCategory')
  yield knex.schema.dropTableIfExists('DeviceConfiguration')
  yield knex.schema.dropTableIfExists('DeviceOperation')
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
  yield knex.schema.dropTableIfExists('DeviceSim')

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

function addCreateFieldsNullable(table){
  table.dateTime('createdOn')
  table.integer('createdBy').unsigned()
    .index().references('id').inTable('User')
}

// Adds updatedOn, updatedBy
function addUpdateFieldsNullable(table){
  table.dateTime('updatedOn')
  table.integer('updatedBy').unsigned()
    .index().references('id').inTable('User')
}
