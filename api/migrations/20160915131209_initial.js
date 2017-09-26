module.exports = require('../src/db').migration(up, down)

function* up(knex) {
  yield knex.raw('SET foreign_key_checks = 0')

  yield knex.schema.createTable('PartnerType', pt => {
    pt.increments('id')
    pt.string('name').notNullable()
  })

  yield knex.schema.createTable('Partner', partner => {
    partner.increments('id')
    partner
      .integer('partnerTypeId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('PartnerType')
    partner.string('name').notNullable()
    partner.string('plugin')
    partner.integer('deviceLogHistoryDays').notNullable().defaultTo(30)
    partner.integer('autoAcknowledgeOlderThanDays')
    partner.integer('numberToLeaveUnacknowledged')
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
    user.string('resetPasswordToken', 36)
    user.dateTime('resetPasswordTokenExpires')
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
    // TODO: Move timezone to LGA table
    country.string('timezone').notNullable()
    country.string('portNumber')
    country.string('exportColumns', 2500).notNullable()
    country.string('tagPrefix', 45)
    country.string('tagRegexSampleId', 45)
    country.string('tagRegexPatientId ', 45)
    country.string('tagRegexNotes', 45)
    country.string('patientPhoneRegex', 100)
    country.string('notesSmsText', 2000)
    country.integer('inventoryDaysThreshold')
    country.string('testEqaRegex', 45)
    country.integer('monthStartsOnDay')
    country.integer('weekStartsOnDay ')
    country.charset('utf8')
  })

  yield knex.schema.createTable('State', state => {
    state.increments('id')
    state.string('name').notNullable()
    state.string('abbreviation', 10)
    state.charset('utf8')
  })

  yield knex.schema.createTable('Lga', lga => {
    lga.increments('id')
    lga.string('name').notNullable()
    lga.charset('utf8')
  })

  yield knex.schema.createTable('Geography', geography => {
    geography.increments('id')
    geography
      .integer('countryId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Country')
    geography
      .integer('stateId')
      .unsigned()
      .index()
      .references('id')
      .inTable('State')
    geography
      .integer('lgaId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Lga')
    geography.charset('utf8')
  })

  yield knex.schema.createTable('Person', person => {
    person.increments('id')
    person.integer('userId').unsigned().index().references('id').inTable('User')
    person
      .integer('geographyId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Geography')
    person.string('name', 500).notNullable()
    person.string('title')
    person.string('email', 500)
    person.string('email2', 500)
    person.string('phone', 45)
    person.string('cell', 45)
    person.string('zip', 45)
    person.string('notes', 2000)
    person
      .integer('lastPartnerId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Partner')
    person
      .integer('lastCountryId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Country')
    // TODO timezone table? < Bryan: I don't think this is required. Timezones are static
    person.string('timezone').notNullable()
    // TODO should user preferences be stored in separate table?
    person.boolean('hidePatientId')
    person.boolean('hideSampleId')
    person.boolean('hideNotes')
    person.string('culture', 45).notNullable()
    person.dateTime('acceptedLicenseOn')
    addCreateFields(person)
    addUpdateFields(person)
    person.charset('utf8')
  })

  yield knex.schema.createTable('JobFunction', jobFunction => {
    jobFunction.increments('id')
    jobFunction.string('name').notNullable()
    jobFunction
      .integer('partnerId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('Partner')
    jobFunction.charset('utf8')
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

  yield knex.schema.createTable(
    'JobFunctionPermission',
    jobFunctionPermission => {
      jobFunctionPermission
        .integer('jobFunctionId')
        .unsigned()
        .index()
        .references('id')
        .inTable('JobFunction')
      jobFunctionPermission
        .integer('permissionId')
        .unsigned()
        .index()
        .references('id')
        .inTable('Permission')
      jobFunctionPermission.primary(['permissionId', 'jobFunctionId'])
      jobFunctionPermission.charset('utf8')
    }
  )

  yield knex.schema.createTable('Job', job => {
    job.increments('id')
    job
      .integer('personId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Person')
    job
      .integer('jobFunctionId')
      .unsigned()
      .index()
      .references('id')
      .inTable('JobFunction')
    job.unique(['personId', 'jobFunctionId'])
    job.charset('utf8')
  })

  yield knex.schema.createTable('JobContext', jobContext => {
    jobContext.increments('id')
    jobContext
      .integer('jobId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('Job')
    jobContext
      .integer('geographyId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Geography')
    jobContext
      .integer('siteId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Site')
    jobContext.charset('utf8')
  })

  yield knex.schema.createTable('RefreshToken', refreshToken => {
    refreshToken
      .integer('userId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('User')
    refreshToken.string('clientId', 128).notNullable()
    refreshToken.string('clientName').notNullable()
    refreshToken.string('token').notNullable()
    refreshToken.dateTime('expires').notNullable()
    refreshToken.boolean('revoked').notNullable().defaultTo(0)
    refreshToken.dateTime('createdOn').notNullable()
    refreshToken.primary(['userId', 'clientId'])
    refreshToken.charset('utf8')
  })

  yield knex.schema.createTable('DeviceApiKey', apiKey => {
    apiKey.increments('id')
    apiKey.string('token').notNullable().unique().index()
    apiKey.boolean('revoked').notNullable().defaultTo(0)
    apiKey
      .integer('partnerId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Partner')
    apiKey
      .integer('geographyId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Geography')
    apiKey.integer('siteId').unsigned().index().references('id').inTable('Site')
    apiKey
      .integer('deviceId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Device')
    addCreateFields(apiKey)
    addUpdateFields(apiKey)
    apiKey.charset('utf8')
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
    deviceType
      .integer('deviceTypeCategoryId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('DeviceTypeCategory')
    deviceType.string('externalId').notNullable()
    deviceType.string('name').notNullable()
    deviceType.string('manufacturer').notNullable()
    deviceType.specificType('configurationDataSchema', 'JSON')
    deviceType.specificType('deviceOperationSchema', 'JSON')
    deviceType.charset('utf8')
    // TODO add device_type id1 - id4_query or appropriate alternative
    // used to uniquely identify devices and still to be discussed
  })

  yield knex.schema.createTable('DeviceStatus', deviceStatus => {
    deviceStatus.increments('id')
    deviceStatus.string('name').notNullable()
    deviceStatus.string('i18nKey')
    deviceStatus.string('token')
  })

  yield knex.schema.createTable('Site', site => {
    site.increments('id')
    site.string('name').notNullable()
    site.string('shortname', 45)
    site.string('externalId').notNullable()
    site.string('notes', 2000)
    // TODO is site to partner many to many?
    site
      .integer('partnerId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Partner')
    site
      .integer('geographyId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Geography')
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
    device
      .integer('deviceId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Device')
    device
      .integer('partnerId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Partner')
    device
      .integer('geographyId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Geography')
    device.integer('siteId').unsigned().index().references('id').inTable('Site')
    device
      .integer('deviceTypeId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('DeviceType')
    device
      .integer('deviceStatusId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('DeviceStatus')

    // TODO Add device id1 - id4 or equivalent
    // used to uniquely identify provisioned devices, still to be discussed
    device.string('name').notNullable()
    device.string('shortname', 45)
    device.string('macAddress')
    device.string('serial')
    device.string('hostId')
    device.string('culture', 45)
    device.string('timezone', 45)
    device.string('notes', 2000)
    device.dateTime('lastSeenOn').notNullable()
    device.dateTime('lastPingOn')
    device.string('lastPingFromIp', 45)
    device.dateTime('putInService')
    device.string('putInServiceSource')
    device.dateTime('approvedOn')
    device
      .integer('approvedBy')
      .unsigned()
      .index()
      .references('id')
      .inTable('User')
    device.specificType('configurationData', 'JSON')
    addCreateFieldsNullable(device)
    addUpdateFieldsNullable(device)
    device.charset('utf8')
  })

  yield knex.schema.createTable('DeviceSim', sim => {
    sim.increments('id')
    sim
      .integer('deviceId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('Device')
    sim.string('provider')
    sim.string('serial')
    sim.string('number')
    addCreateFields(sim)
    addUpdateFields(sim)
    sim.charset('utf8')
  })

  yield knex.schema.createTable('DeviceSiteHistory', history => {
    history.increments('id')
    history
      .integer('deviceId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('Device')
    history
      .integer('siteId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('Site')
    addCreateFieldsNullable(history)
    history.charset('utf8')
  })

  yield knex.schema.createTable('DeviceOperation', op => {
    op.increments('id')
    op
      .integer('deviceId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('Device')
    op.string('externalId')
    op.dateTime('startedOn')
    op.dateTime('endedOn')
    op.specificType('data', 'JSON').notNullable()
    addCreateFieldsNullable(op)
    op.charset('utf8')
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
    assay.string('externalId').notNullable()
    assay
      .integer('assayTypeId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('AssayType')
    assay
      .integer('deviceTypeId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('DeviceType')
    assay.string('resultCategory1Label')
    assay.string('resultCategory1i18nKey')
    assay.string('resultCategory2Label')
    assay.string('resultCategory2i18nKey')
    assay.specificType('resultDataSchema', 'JSON')
    assay.specificType('patientDataSchema', 'JSON')
    assay.charset('utf8')
  })

  yield knex.schema.createTable('ResultSource', resultType => {
    resultType.increments('id')
    resultType.string('name').notNullable()
    resultType.string('i18nKey')
    resultType.string('externalId').notNullable()
    resultType.charset('utf8')
  })

  yield knex.schema.createTable('ResultGeneratedResult', table => {
    table
      .integer('sourceResultId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Result')
    table
      .integer('generatedResultId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Result')
    table.primary(['sourceResultId', 'generatedResultId'])
    table.charset('utf8')
  })

  yield knex.schema.createTable('ResultType', resultType => {
    resultType.increments('id')
    resultType.string('name').notNullable()
    resultType.string('i18nKey')
    resultType.string('externalId').notNullable()
    resultType.charset('utf8')
  })

  // holds general categories such as "Detected"/"Invalid"
  yield knex.schema.createTable('ResultCategory', resultCategory => {
    resultCategory.increments('id')
    resultCategory.string('name').notNullable()
    resultCategory.string('i18nKey')
    resultCategory.string('externalId').notNullable()
    resultCategory.charset('utf8')
  })

  // which result categories apply to which assays?
  yield knex.schema.createTable(
    'ResultCategoryAssay',
    resultTypeCategoryAssay => {
      resultTypeCategoryAssay
        .integer('resultCategoryId')
        .unsigned()
        .notNullable()
        .index()
        .references('id')
        .inTable('ResultCategory')
      resultTypeCategoryAssay
        .integer('assayId')
        .unsigned()
        .notNullable()
        .index()
        .references('id')
        .inTable('Assay')
      resultTypeCategoryAssay.unique(['resultCategoryId', 'assayId'])
    }
  )

  yield knex.schema.createTable('SampleType', sampleType => {
    sampleType.increments('id')
    sampleType.string('name').notNullable()
    sampleType.string('i18nKey').notNullable()
    sampleType.string('externalId').notNullable()
    sampleType.charset('utf8')
  })

  // the sample that the result is based on (multiple results can refer to the same sample)
  yield knex.schema.createTable('Sample', sample => {
    sample.increments('id')
    sample.string('externalId')
    sample.dateTime('collectedOn')
    sample
      .integer('sampleTypeId')
      .unsigned()
      .index()
      .references('id')
      .inTable('SampleType')
    sample
      .integer('originSiteId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Site')
    sample.charset('utf8')
  })

  yield knex.schema.createTable('Result', result => {
    result.increments('id')
    result.string('externalId')
    result
      .integer('assayId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('Assay')
    result
      .integer('partnerId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Partner')
    result
      .integer('geographyId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Geography')
    result.integer('siteId').unsigned().index().references('id').inTable('Site')
    result
      .integer('deviceId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('Device')
    result
      .integer('resultWorkflowStatusId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('ResultWorkflowStatus')
    result.float('longitude', 10, 6)
    result.float('latitude', 10, 6)
    result
      .integer('resultSourceId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('ResultSource')
    result
      .integer('resultTypeId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('ResultType')
    result
      .integer('sampleId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('Sample')
    result.string('sampleRunNumber')
    result.string('sampleGroup')
    result
      .integer('resultCategory1')
      .unsigned()
      .index()
      .references('id')
      .inTable('ResultCategory')
    result
      .integer('resultCategory2')
      .unsigned()
      .index()
      .references('id')
      .inTable('ResultCategory')
    result.specificType('resultData', 'JSON')
    result.string('assayVersion')
    result.dateTime('startedOn')
    result.dateTime('endedOn')
    result.string('consumableSerial')
    result.dateTime('consumableExpirationDate')
    result.string('consumableLot')
    result.string('instrumentSerial')
    result.string('moduleName')
    result.string('moduleSerial')
    result.string('researchId')
    result.specificType('patientData', 'JSON')
    result.string('senderVersion')
    result.string('senderOperator')
    result.string('notes', 2000)
    result.text('oemData')
    result.text('rawData')
    result.string('errorCode')
    result.string('errorNotes', 2000)
    result.boolean('qcCheck').notNullable().defaultTo(0)
    addCreateFieldsNullable(result)
    addUpdateFieldsNullable(result)
    result.charset('utf8')
  })

  yield knex.schema.createTable('DeviceLog', deviceLog => {
    deviceLog.bigincrements('id')
    deviceLog
      .integer('deviceId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('Device')
    deviceLog.string('source').notNullable() // LIS listener, API...
    deviceLog.dateTime('createdOn').notNullable().index()
    deviceLog.string('senderIp').notNullable()
    deviceLog.string('checkpoint').index()
    deviceLog.text('rawMessage')
    deviceLog.boolean('deviceConfigurationUpdated').notNullable().defaultTo(0)
    deviceLog
      .integer('resultId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Result')
    deviceLog
      .integer('deviceOperationId')
      .unsigned()
      .index()
      .references('id')
      .inTable('DeviceOperation')
    deviceLog.charset('utf8')
  })

  yield knex.schema.createTable('Unit', unit => {
    unit.increments('id')
    unit.string('name').notNullable()
    unit.string('shortname')
    unit.charset('utf8')
  })

  yield knex.schema.createTable('Consumable', consumable => {
    consumable.increments('id')
    consumable.string('name').notNullable()
    consumable
      .integer('partnerId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Partner')
    consumable
      .integer('unit')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('Unit')
    consumable.boolean('canExpire').notNullable().defaultTo(0)
    consumable.text('manufacturer')
    consumable.boolean('autoInclude').notNullable().defaultTo(0)
    consumable.charset('utf8')
  })

  yield knex.schema.createTable('ConsumableReason', consumableReason => {
    consumableReason.increments('id')
    consumableReason.string('name').notNullable()
    consumableReason.string('i18nKey')
    consumableReason.boolean('decrease').notNullable().defaultTo(0)
    consumableReason.charset('utf8')
  })

  yield knex.schema.createTable('ConsumableAssay', consumableAssay => {
    consumableAssay
      .integer('consumableId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('Consumable')
    consumableAssay
      .integer('assayId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('Assay')
    consumableAssay.float('quantity').notNullable()
    consumableAssay.unique(['consumableId', 'assayId'])
  })

  // Result status table
  yield knex.schema.createTable(
    'ResultWorkflowStatus',
    resultWorkflowStatus => {
      resultWorkflowStatus.increments('id')
      resultWorkflowStatus.string('name').notNullable()
      resultWorkflowStatus.string('externalId').notNullable()
      resultWorkflowStatus.string('i18nKey')
    }
  )

  yield knex.schema.createTable('ResultWorkflowLog', resultWorkflowLog => {
    resultWorkflowLog.increments('id')
    resultWorkflowLog
      .integer('resultId')
      .unsigned()
      .references('id')
      .inTable('Result')
    resultWorkflowLog
      .integer('resultWorkflowStatusId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('ResultWorkflowStatus')
    resultWorkflowLog.string('reason')
    resultWorkflowLog.string('operator')
    resultWorkflowLog.dateTime('changedOn').notNullable()
    addCreateFieldsNullable(resultWorkflowLog)
  })

  yield knex.schema.createTable('InventoryItem', inventoryItem => {
    inventoryItem.increments('id')
    inventoryItem
      .integer('consumableId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('Consumable')
    inventoryItem
      .integer('siteId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('Site')
    inventoryItem.integer('inTransitFromSiteId').unsigned()
    inventoryItem.string('lotNumber')
    inventoryItem.dateTime('expiresOn')
    inventoryItem.float('quantityOnHand')
    inventoryItem.dateTime('createdOn').notNullable()
    inventoryItem
      .integer('createdBy')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('User')
    inventoryItem.dateTime('updatedOn').notNullable()
    inventoryItem
      .integer('updatedBy')
      .unsigned()
      .index()
      .references('id')
      .inTable('User')
    inventoryItem.charset('utf8')
  })

  yield knex.schema.createTable('InventoryLog', inventoryLog => {
    inventoryLog.increments('id')
    inventoryLog
      .integer('inventoryItemId')
      .unsigned()
      .references('id')
      .inTable('InventoryItem')
      .onDelete('SET NULL')
    inventoryLog
      .integer('consumableId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('Consumable')
    inventoryLog
      .integer('siteId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('Site')
    inventoryLog
      .integer('consumableReasonId')
      .unsigned()
      .references('id')
      .inTable('ConsumableReason')
    inventoryLog
      .integer('resultId')
      .unsigned()
      .references('id')
      .inTable('Result')
    inventoryLog.string('operation', 50)
    inventoryLog.string('lotNumber')
    inventoryLog.dateTime('expiresOn')
    inventoryLog.float('quantity')
    inventoryLog.string('notes', 2000)
    inventoryLog.dateTime('adjustedFrom')
    inventoryLog.dateTime('adjustedTo')
    inventoryLog.dateTime('createdOn').notNullable()
    inventoryLog
      .integer('createdBy')
      .unsigned()
      .index()
      .references('id')
      .inTable('User')
    inventoryLog.charset('utf8')
  })

  // this table logs any change of QC-Check checkbox on 'Result Details' page
  yield knex.schema.createTable('ResultQualityControlLog', x => {
    x.increments('id')
    x.integer('resultId').unsigned().references('id').inTable('Result')
    x.boolean('qcCheck').notNullable().defaultTo(0)
    x.dateTime('createdOn').notNullable()
    x
      .integer('createdBy')
      .notNullable()
      .unsigned()
      .index()
      .references('id')
      .inTable('User')
    x.charset('utf8')
  })

  yield knex.raw('SET foreign_key_checks = 1')
}

function* down(knex) {
  yield knex.raw('SET foreign_key_checks = 0')

  yield knex.schema.dropTableIfExists('InventoryLog')
  yield knex.schema.dropTableIfExists('ConsumableAssay')
  yield knex.schema.dropTableIfExists('ResultWorkflowLog')
  yield knex.schema.dropTableIfExists('ResultWorkflowStatus')
  yield knex.schema.dropTableIfExists('ConsumableAssay')
  yield knex.schema.dropTableIfExists('InventoryItem')
  yield knex.schema.dropTableIfExists('ConsumableReason')
  yield knex.schema.dropTableIfExists('Unit')
  yield knex.schema.dropTableIfExists('Consumable')
  yield knex.schema.dropTableIfExists('ResultCategoryAssay')
  yield knex.schema.dropTableIfExists('ResultSource')
  yield knex.schema.dropTableIfExists('ResultGeneratedResult')
  yield knex.schema.dropTableIfExists('ResultType')
  yield knex.schema.dropTableIfExists('ResultCategory')
  yield knex.schema.dropTableIfExists('ResultLog')
  yield knex.schema.dropTableIfExists('DeviceLog')
  yield knex.schema.dropTableIfExists('DeviceLogUpdate')
  yield knex.schema.dropTableIfExists('Result')
  yield knex.schema.dropTableIfExists('SampleType')
  yield knex.schema.dropTableIfExists('Sample')
  yield knex.schema.dropTableIfExists('Assay')
  yield knex.schema.dropTableIfExists('AssayType')
  yield knex.schema.dropTableIfExists('DeviceSiteHistory')
  yield knex.schema.dropTableIfExists('Device')
  yield knex.schema.dropTableIfExists('Site')
  yield knex.schema.dropTableIfExists('DeviceTypeCategory')
  yield knex.schema.dropTableIfExists('DeviceConfiguration')
  yield knex.schema.dropTableIfExists('DeviceOperation')
  yield knex.schema.dropTableIfExists('DeviceType')
  yield knex.schema.dropTableIfExists('DeviceStatus')
  yield knex.schema.dropTableIfExists('DeviceRole')
  yield knex.schema.dropTableIfExists('DeviceApiKey')
  yield knex.schema.dropTableIfExists('RefreshToken')
  yield knex.schema.dropTableIfExists('JobFunctionPermission')
  yield knex.schema.dropTableIfExists('JobFunction')
  yield knex.schema.dropTableIfExists('JobContext')
  yield knex.schema.dropTableIfExists('Job')
  yield knex.schema.dropTableIfExists('UserRole')
  yield knex.schema.dropTableIfExists('RolePermission')
  yield knex.schema.dropTableIfExists('Permission')
  yield knex.schema.dropTableIfExists('Role')
  yield knex.schema.dropTableIfExists('Person')
  yield knex.schema.dropTableIfExists('Lga')
  yield knex.schema.dropTableIfExists('State')
  yield knex.schema.dropTableIfExists('Country')
  yield knex.schema.dropTableIfExists('Geography')
  yield knex.schema.dropTableIfExists('User')
  yield knex.schema.dropTableIfExists('DataFilter')
  yield knex.schema.dropTableIfExists('OrgUnit')
  yield knex.schema.dropTableIfExists('Partner')
  yield knex.schema.dropTableIfExists('PartnerType')
  yield knex.schema.dropTableIfExists('DeviceSim')
  yield knex.schema.dropTableIfExists('ResultQualityControlLog')

  yield knex.raw('SET foreign_key_checks = 1')
}

// Adds createdOn, createdBy
function addCreateFields(table) {
  table.dateTime('createdOn').notNullable()
  table
    .integer('createdBy')
    .unsigned()
    .notNullable()
    .index()
    .references('id')
    .inTable('User')
}

// Adds updatedOn, updatedBy
function addUpdateFields(table) {
  table.dateTime('updatedOn').notNullable()
  table
    .integer('updatedBy')
    .unsigned()
    .notNullable()
    .index()
    .references('id')
    .inTable('User')
}

function addCreateFieldsNullable(table) {
  table.dateTime('createdOn')
  table.integer('createdBy').unsigned().index().references('id').inTable('User')
}

// Adds updatedOn, updatedBy
function addUpdateFieldsNullable(table) {
  table.dateTime('updatedOn')
  table.integer('updatedBy').unsigned().index().references('id').inTable('User')
}
