const {
  addCreateFields,
  addUpdateFields,
  addCreateFieldsNullable,
  addUpdateFieldsNullable,
  addTimestamps,
} = require('./utils/index')

module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.raw('SET foreign_key_checks = 0')

  await knex.schema.createTable('PartnerType', pt => {
    pt.increments('id')
    pt.string('name').notNullable()
  })

  await knex.schema.createTable('Partner', partner => {
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
    partner
      .integer('deviceLogHistoryDays')
      .notNullable()
      .defaultTo(30)
    partner.integer('autoAcknowledgeOlderThanDays')
    partner.integer('numberToLeaveUnacknowledged')
    partner.integer('maxDaysDeviceOffline')
    partner.integer('maxDaysDeviceNoResults')
  })

  await knex.schema.createTable('User', user => {
    user.increments('id')
    user
      .string('name')
      .unique()
      .notNullable()
    user.string('password', 128).notNullable()
    user.boolean('approved').notNullable()
    user.dateTime('lastActive')
    user.dateTime('lastLogin')
    user.dateTime('lastPasswordChange')
    user.dateTime('createdOn').notNullable()
    user.boolean('lockedOut').notNullable()
    user
      .integer('failedPasswordAttempts')
      .unsigned()
      .notNullable()
    user
      .boolean('legacyPassword')
      .notNullable()
      .defaultTo(0)
    user.string('resetPasswordToken', 36)
    user.dateTime('resetPasswordTokenExpires')
    user.charset('utf8')
  })

  await knex.schema.createTable('Country', country => {
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

  await knex.schema.createTable('State', state => {
    state.increments('id')
    state.string('name').notNullable()
    state.string('abbreviation', 10)
    state.charset('utf8')
  })

  await knex.schema.createTable('Lga', lga => {
    lga.increments('id')
    lga.string('name').notNullable()
    lga.charset('utf8')
  })

  await knex.schema.createTable('Geography', geography => {
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

  await knex.schema.createTable('Person', person => {
    person.increments('id')
    person
      .integer('userId')
      .unsigned()
      .index()
      .references('id')
      .inTable('User')
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

  await knex.schema.createTable('JobFunction', jobFunction => {
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

  await knex.schema.createTable('Permission', permission => {
    permission.increments('id')

    // e.g. clinical, inventory, operational, device, etc.
    permission.string('module').notNullable()
    // e.g.: view, edit, admin, view:aggregate, view:historical etc
    permission.string('activity').notNullable()

    // Since permissions are static, UI labels can be created programmatically
    permission.charset('utf8')
  })

  await knex.schema.createTable('Feature', feature => {
    feature.increments('id')
    feature.string('module').notNullable()
    feature.charset('utf8')
  })

  await knex.schema.createTable('JobFunctionFeature', jobFunctionFeature => {
    jobFunctionFeature
      .integer('jobFunctionId')
      .unsigned()
      .index()
      .references('id')
      .inTable('JobFunction')
    jobFunctionFeature
      .integer('featureId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Feature')
    jobFunctionFeature.primary(['jobFunctionId', 'featureId'])
    jobFunctionFeature.charset('utf8')
  })

  await knex.schema.createTable(
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

  await knex.schema.createTable('Job', job => {
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

  await knex.schema.createTable('JobContext', jobContext => {
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

  await knex.schema.createTable('RefreshToken', refreshToken => {
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
    refreshToken
      .boolean('revoked')
      .notNullable()
      .defaultTo(0)
    refreshToken.dateTime('createdOn').notNullable()
    refreshToken.primary(['userId', 'clientId'])
    refreshToken.charset('utf8')
  })

  await knex.schema.createTable('DeviceApiKey', apiKey => {
    apiKey.increments('id')
    apiKey
      .string('token')
      .notNullable()
      .unique()
      .index()
    apiKey
      .boolean('revoked')
      .notNullable()
      .defaultTo(0)
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
    apiKey
      .integer('siteId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Site')
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

  await knex.schema.createTable('DeviceTypeCategory', deviceTypeFeature => {
    deviceTypeFeature.increments('id')
    deviceTypeFeature.string('name').notNullable()
    deviceTypeFeature
      .boolean('hasConnectivity')
      .notNullable()
      .defaultTo(0)
    deviceTypeFeature
      .boolean('hasResults')
      .notNullable()
      .defaultTo(0)
    deviceTypeFeature.charset('utf8')
  })

  await knex.schema.createTable('DeviceType', deviceType => {
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
    deviceType.string('plugin')
    deviceType.specificType('configurationDataSchema', 'JSON')
    deviceType.specificType('deviceOperationSchema', 'JSON')
    deviceType.charset('utf8')
    // TODO add device_type id1 - id4_query or appropriate alternative
    // used to uniquely identify devices and still to be discussed
  })

  await knex.schema.createTable('DeviceStatus', deviceStatus => {
    deviceStatus.increments('id')
    deviceStatus.string('name').notNullable()
    deviceStatus.string('i18nKey')
    deviceStatus.string('token')
  })

  await knex.schema.createTable(
    'DeviceMaintenanceStatus',
    maintenanceStatus => {
      maintenanceStatus.increments('id')
      maintenanceStatus.string('name').notNullable()
      maintenanceStatus.string('i18nKey')
      maintenanceStatus.string('token')
    }
  )

  await knex.schema.createTable('Site', site => {
    site.increments('id')
    site.string('name').notNullable()
    site.string('shortName', 45)
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
    addCreateFieldsNullable(site)
    addUpdateFieldsNullable(site)
    site.charset('utf8')
  })

  await knex.schema.createTable('DeviceStatusLog', deviceStatusLog => {
    deviceStatusLog.increments('id')
    deviceStatusLog
      .integer('deviceId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Device')
    deviceStatusLog
      .integer('deviceStatusId')
      .unsigned()
      .index()
      .references('id')
      .inTable('DeviceStatus')
    deviceStatusLog.dateTime('changedOn')
    deviceStatusLog.dateTime('createdOn')
    deviceStatusLog
      .integer('createdBy')
      .unsigned()
      .index()
      .references('id')
      .inTable('User')
  })

  await knex.schema.createTable(
    'DeviceMaintenanceStatusLog',
    maintenanceStatusLog => {
      maintenanceStatusLog.increments('id')
      maintenanceStatusLog
        .integer('deviceId')
        .unsigned()
        .index()
        .references('id')
        .inTable('Device')
        .onDelete('CASCADE')
      maintenanceStatusLog
        .integer('deviceMaintenanceStatusId')
        .unsigned()
        .index()
        .references('id')
        .inTable('DeviceMaintenanceStatus')
        .onDelete('SET NULL')
      maintenanceStatusLog.specificType('data', 'JSON').notNullable()
      maintenanceStatusLog.dateTime('changedOn')
      maintenanceStatusLog.dateTime('createdOn')
      maintenanceStatusLog
        .integer('createdBy')
        .unsigned()
        .index()
        .references('id')
        .inTable('User')
        .onDelete('SET NULL')
    }
  )

  await knex.schema.createTable('Device', device => {
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
    device
      .integer('siteId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Site')
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
    device.string('shortName', 45)
    device.string('macAddress')
    device.string('serial')
    device.string('hostId')
    device.string('culture', 45)
    device.string('timezone', 45)
    device.string('notes', 2000)
    device.dateTime('lastSeenOn')
    device.dateTime('lastPingOn')
    device.string('lastPingFromIp', 45)
    device.dateTime('putInService')
    device.string('putInServiceSource')
    device.specificType('configurationData', 'JSON')
    addCreateFieldsNullable(device)
    addUpdateFieldsNullable(device)
    device.charset('utf8')
  })

  await knex.schema.createTable('DeviceSim', sim => {
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

  await knex.schema.createTable('DeviceSiteHistory', history => {
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

  await knex.schema.createTable('DeviceOperation', op => {
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

  await knex.schema.createTable('AssayType', assayType => {
    assayType.increments('id')
    assayType.string('name').notNullable()
    assayType.string('i18nKey')
    assayType.charset('utf8')
  })

  await knex.schema.createTable('Assay', assay => {
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
    assay
      .integer('resultSourceId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('ResultSource')
    assay.string('resultCategory1Label')
    assay.string('resultCategory1i18nKey')
    assay.string('resultCategory2Label')
    assay.string('resultCategory2i18nKey')
    assay.specificType('resultDataSchema', 'JSON')
    assay.specificType('patientDataSchema', 'JSON')
    assay.charset('utf8')
  })

  await knex.schema.createTable('ResultSource', resultType => {
    resultType.increments('id')
    resultType.string('name').notNullable()
    resultType.string('i18nKey')
    resultType.string('externalId').notNullable()
    resultType.charset('utf8')
  })

  await knex.schema.createTable('ResultGeneratedResult', table => {
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

  await knex.schema.createTable('ResultType', resultType => {
    resultType.increments('id')
    resultType.string('name').notNullable()
    resultType.string('i18nKey')
    resultType.string('externalId').notNullable()
    resultType.charset('utf8')
  })

  // holds general categories such as "Detected"/"Invalid"
  await knex.schema.createTable('ResultCategory', resultCategory => {
    resultCategory.increments('id')
    resultCategory.string('name').notNullable()
    resultCategory.string('i18nKey')
    resultCategory.string('externalId').notNullable()
    resultCategory.charset('utf8')
  })

  // which result categories apply to which assays?
  await knex.schema.createTable(
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

  await knex.schema.createTable('SampleType', sampleType => {
    sampleType.increments('id')
    sampleType.string('name').notNullable()
    sampleType.string('i18nKey').notNullable()
    sampleType.string('externalId').notNullable()
    sampleType.charset('utf8')
  })

  // the sample that the result is based on (multiple results can refer to the same sample)
  await knex.schema.createTable('Sample', sample => {
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

  await knex.schema.createTable('Result', result => {
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
    result
      .integer('siteId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Site')
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
    result.dateTime('endedOn').index()
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
    result
      .boolean('qcCheck')
      .notNullable()
      .defaultTo(0)
    addCreateFieldsNullable(result)
    addUpdateFieldsNullable(result)
    result.charset('utf8')
  })

  await knex.schema.createTable('DeviceLog', deviceLog => {
    deviceLog.bigincrements('id')
    deviceLog
      .integer('deviceId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Device')
    deviceLog.string('source').notNullable() // LIS listener, API...
    deviceLog
      .dateTime('createdOn')
      .notNullable()
      .index()
    deviceLog.string('senderIp').notNullable()
    deviceLog.string('checkpoint').index()
    deviceLog.text('rawMessage')
    deviceLog
      .boolean('deviceConfigurationUpdated')
      .notNullable()
      .defaultTo(0)
    deviceLog
      .integer('resultId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Result')
      .onDelete('SET NULL')
    deviceLog
      .integer('deviceOperationId')
      .unsigned()
      .index()
      .references('id')
      .inTable('DeviceOperation')
      .onDelete('SET NULL')
    deviceLog.charset('utf8')
  })

  await knex.schema.createTable('Unit', unit => {
    unit.increments('id')
    unit.string('name').notNullable()
    unit.string('shortName')
    unit.charset('utf8')
  })

  await knex.schema.createTable('Consumable', consumable => {
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
    consumable
      .boolean('canExpire')
      .notNullable()
      .defaultTo(0)
    consumable.text('manufacturer')
    consumable
      .boolean('autoInclude')
      .notNullable()
      .defaultTo(0)
    consumable.charset('utf8')
  })

  await knex.schema.createTable('ConsumableReason', consumableReason => {
    consumableReason.increments('id')
    consumableReason.string('name').notNullable()
    consumableReason.string('i18nKey')
    consumableReason
      .boolean('decrease')
      .notNullable()
      .defaultTo(0)
    consumableReason
      .boolean('reset')
      .notNullable()
      .defaultTo(0)
    consumableReason.charset('utf8')
  })

  await knex.schema.createTable('ConsumableAssay', consumableAssay => {
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
  await knex.schema.createTable(
    'ResultWorkflowStatus',
    resultWorkflowStatus => {
      resultWorkflowStatus.increments('id')
      resultWorkflowStatus.string('name').notNullable()
      resultWorkflowStatus.string('externalId').notNullable()
      resultWorkflowStatus.string('i18nKey')
    }
  )

  await knex.schema.createTable('ResultWorkflowLog', resultWorkflowLog => {
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

  await knex.schema.createTable('InventoryItem', inventoryItem => {
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
    inventoryItem.date('expiresOn')
    inventoryItem.float('quantityOnHand')
    addCreateFieldsNullable(inventoryItem)
    addUpdateFieldsNullable(inventoryItem)
    inventoryItem.charset('utf8')
  })

  await knex.schema.createTable('InventoryLog', inventoryLog => {
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
    inventoryLog.date('expiresOn')
    inventoryLog.float('quantity')
    inventoryLog.string('notes', 2000)
    inventoryLog.dateTime('adjustedFrom')
    inventoryLog.dateTime('adjustedTo')
    addCreateFieldsNullable(inventoryLog)
    inventoryLog.charset('utf8')
  })

  // this table logs any change of QC-Check checkbox on 'Result Details' page
  await knex.schema.createTable(
    'ResultQualityControlLog',
    resultQualityControlLog => {
      resultQualityControlLog.increments('id')
      resultQualityControlLog
        .integer('resultId')
        .unsigned()
        .references('id')
        .inTable('Result')
      resultQualityControlLog
        .boolean('qcCheck')
        .notNullable()
        .defaultTo(0)
      addCreateFields(resultQualityControlLog)
      resultQualityControlLog.charset('utf8')
    }
  )

  // Messages

  // Initial, Pending, Sent, Error
  await knex.schema.createTable('MessageStatus', messageStatus => {
    messageStatus.increments('id')
    messageStatus.string('name').notNullable()
    messageStatus.string('i18nKey').notNullable()
    messageStatus.string('externalId').notNullable()
    messageStatus.charset('utf8')
  })

  // Alert, Recommendation
  await knex.schema.createTable('MessageSeverity', messageSeverity => {
    messageSeverity.increments('id')
    messageSeverity.string('name').notNullable()
    messageSeverity.string('i18nKey').notNullable()
    messageSeverity.string('externalId').notNullable()
    messageSeverity.charset('utf8')
  })

  await knex.schema.createTable('AlertTemplate', alertTemplate => {
    alertTemplate.increments('id')
    alertTemplate.text('message').notNullable()
    addCreateFieldsNullable(alertTemplate)
    addUpdateFieldsNullable(alertTemplate)
    alertTemplate.charset('utf8')
  })

  await knex.schema.createTable('AlertMessage', alertMessage => {
    alertMessage.increments('id')
    alertMessage
      .integer('alertTemplateId')
      .unsigned()
      .references('id')
      .inTable('AlertTemplate')
      .notNullable()
    alertMessage
      .integer('messageStatusId')
      .unsigned()
      .references('id')
      .inTable('MessageStatus')
      .notNullable()
    alertMessage
      .integer('personId')
      .unsigned()
      .references('id')
      .inTable('Person')
      .notNullable()
    alertMessage
      .integer('siteId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Site')
    alertMessage
      .integer('deviceId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Device')
    alertMessage
      .integer('resultId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Result')
    alertMessage.text('message')
    addTimestamps(alertMessage)
    alertMessage.charset('utf8')
  })

  await knex.schema.createTable('EmailTemplate', emailTemplate => {
    emailTemplate.increments('id')
    emailTemplate.string('subject', 1000).notNullable()
    emailTemplate.text('body').notNullable()
    emailTemplate.text('htmlBody')
    addCreateFieldsNullable(emailTemplate)
    addUpdateFieldsNullable(emailTemplate)
    emailTemplate.charset('utf8')
  })

  await knex.schema.createTable('EmailMessage', emailMessage => {
    emailMessage.increments('id')
    emailMessage
      .integer('emailTemplateId')
      .unsigned()
      .references('id')
      .inTable('EmailTemplate')
      .notNullable()
    emailMessage
      .integer('messageStatusId')
      .unsigned()
      .references('id')
      .inTable('MessageStatus')
      .notNullable()
    emailMessage
      .integer('personId')
      .unsigned()
      .references('id')
      .inTable('Person')
      .notNullable()
    emailMessage
      .integer('siteId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Site')
    emailMessage
      .integer('deviceId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Device')
    emailMessage
      .integer('resultId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Result')
    emailMessage.string('subject', 1000)
    emailMessage.text('body')
    emailMessage.text('htmlBody')
    addTimestamps(emailMessage)
    emailMessage.charset('utf8')
  })

  await knex.schema.createTable('SmsTemplate', smsTemplate => {
    smsTemplate.increments('id')
    smsTemplate.string('message', 1000).notNullable()
    addCreateFieldsNullable(smsTemplate)
    addUpdateFieldsNullable(smsTemplate)
    smsTemplate.charset('utf8')
  })

  await knex.schema.createTable('SmsMessage', smsMessage => {
    smsMessage.increments('id')
    smsMessage
      .integer('smsTemplateId')
      .unsigned()
      .references('id')
      .inTable('SmsTemplate')
      .notNullable()
    smsMessage
      .integer('messageStatusId')
      .unsigned()
      .references('id')
      .inTable('MessageStatus')
      .notNullable()
    smsMessage
      .integer('personId')
      .unsigned()
      .references('id')
      .inTable('Person')
      .notNullable()
    smsMessage
      .integer('siteId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Site')
    smsMessage
      .integer('deviceId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Device')
    smsMessage
      .integer('resultId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Result')
    smsMessage.string('message', 1000)
    addTimestamps(smsMessage)
    smsMessage.charset('utf8')
  })

  // Device Offline, Module Error
  await knex.schema.createTable('MessageType', messageType => {
    messageType.increments('id')
    messageType
      .integer('messageSeverityId')
      .unsigned()
      .references('id')
      .inTable('MessageSeverity')
      .notNullable()
    messageType
      .integer('alertTemplateId')
      .unsigned()
      .references('id')
      .inTable('AlertTemplate')
    messageType
      .integer('emailTemplateId')
      .unsigned()
      .references('id')
      .inTable('EmailTemplate')
    messageType
      .integer('smsTemplateId')
      .unsigned()
      .references('id')
      .inTable('SmsTemplate')
    messageType.charset('utf8')
  })

  // Issues and events

  // holds general categories (aka class), Device Health, Reagent Health
  await knex.schema.createTable('IssueCategory', issueCategory => {
    issueCategory.increments('id')
    issueCategory.string('name').notNullable()
    issueCategory.string('i18nKey').notNullable()
    issueCategory.string('externalId').notNullable()
    issueCategory.charset('utf8')
  })

  // Type of issue Device Offline, Module Error, etc.
  await knex.schema.createTable('IssueType', issueType => {
    issueType.increments('id')
    issueType
      .integer('issueCategoryId')
      .unsigned()
      .references('id')
      .inTable('IssueCategory')
      .notNullable()
    issueType
      .integer('defaultMessageTypeId')
      .unsigned()
      .references('id')
      .inTable('MessageType')
    issueType.string('name').notNullable()
    issueType.string('i18nKey').notNullable()
    issueType.string('externalId').notNullable()
    issueType.charset('utf8')
  })

  // Issue status, e.g. Active, Acknowledged, DueSoon, OK
  await knex.schema.createTable('IssueStatus', issueStatus => {
    issueStatus.increments('id')
    issueStatus.string('name').notNullable()
    issueStatus.string('i18nKey').notNullable()
    issueStatus.string('externalId').notNullable()
    issueStatus.charset('utf8')
  })

  await knex.schema.createTable('IssueStatusLog', issueStatusLog => {
    issueStatusLog.increments('id')
    issueStatusLog
      .integer('issueId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Issue')
      .notNullable()
      .onDelete('CASCADE')
    issueStatusLog
      .integer('issueStatusId')
      .unsigned()
      .index()
      .references('id')
      .inTable('IssueStatus')
      .notNullable()
    issueStatusLog.dateTime('changedOn').notNullable()
    issueStatusLog.dateTime('createdOn').notNullable()
    issueStatusLog
      .integer('createdBy')
      .unsigned()
      .index()
      .references('id')
      .inTable('User')
  })

  // Triggered, Resolved
  await knex.schema.createTable('IssueEventStatus', issueStatus => {
    issueStatus.increments('id')
    issueStatus.string('externalId').notNullable()
    issueStatus.charset('utf8')
  })

  await knex.schema.createTable('Issue', issue => {
    issue.increments('id')
    issue
      .integer('issueTypeId')
      .unsigned()
      .references('id')
      .inTable('IssueType')
      .notNullable()
    issue
      .integer('issueStatusId')
      .unsigned()
      .references('id')
      .inTable('IssueStatus')
      .notNullable()
    issue
      .integer('partnerId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Partner')
      .notNullable()
      .onDelete('CASCADE')
    issue
      .integer('geographyId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Geography')
      .onDelete('SET NULL')
    issue
      .integer('siteId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Site')
      .onDelete('SET NULL')
    issue
      .integer('deviceId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Device')
      .onDelete('SET NULL')
    issue
      .integer('resultId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Result')
      .onDelete('SET NULL')
    issue
      .integer('level')
      .notNullable()
      .defaultTo(1)
    addTimestamps(issue)
    issue.charset('utf8')
  })

  await knex.schema.createTable(
    'IssueEscalationTrigger',
    issueEscalationTrigger => {
      issueEscalationTrigger.increments('id')
      issueEscalationTrigger
        .integer('issueTypeId')
        .unsigned()
        .references('id')
        .inTable('IssueType')
        .notNullable()
      issueEscalationTrigger
        .integer('partnerId')
        .unsigned()
        .index()
        .references('id')
        .inTable('Partner')
        .notNullable()
      issueEscalationTrigger.integer('escalateToLevel').notNullable()
      issueEscalationTrigger.specificType('escalationConditions', 'JSON')
      addTimestamps(issueEscalationTrigger)
      issueEscalationTrigger.charset('utf8')
    }
  )

  await knex.schema.createTable('IssueEvent', issueEvent => {
    issueEvent.increments('id')
    issueEvent
      .integer('issueEventStatusId')
      .unsigned()
      .references('id')
      .inTable('IssueEventStatus')
      .notNullable()
    issueEvent
      .integer('issueId')
      .unsigned()
      .references('id')
      .inTable('Issue')
      .notNullable()
      .onDelete('CASCADE')
    issueEvent.specificType('data', 'JSON')
    addTimestamps(issueEvent, { update: false })
    issueEvent.charset('utf8')
  })

  // Notifications
  await knex.schema.createTable('NotificationType', notificationType => {
    notificationType.increments('id')
    notificationType
      .integer('partnerId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Partner')
      .notNullable()
    notificationType
      .integer('issueTypeId')
      .unsigned()
      .references('id')
      .inTable('IssueType')
      .notNullable()
    notificationType
      .integer('jobFunctionId')
      .unsigned()
      .index()
      .references('id')
      .inTable('JobFunction')
      .notNullable()
    notificationType
      .integer('level')
      .notNullable()
      .defaultTo(1)
    notificationType
      .boolean('canAcknowledge')
      .notNullable()
      .defaultTo(1)
    notificationType
      .integer('messageTypeId')
      .unsigned()
      .references('id')
      .inTable('MessageType')
    notificationType.string('name').notNullable()
    addCreateFields(notificationType)
    addUpdateFields(notificationType)
    notificationType.charset('utf8')
  })

  await knex.schema.createTable('Notification', notification => {
    notification.increments('id')
    notification
      .integer('notificationTypeId')
      .unsigned()
      .references('id')
      .inTable('NotificationType')
      .notNullable()
    notification
      .integer('issueId')
      .unsigned()
      .references('id')
      .inTable('Issue')
      .onDelete('SET NULL')
    notification
      .integer('personId')
      .unsigned()
      .references('id')
      .inTable('Person')
      .notNullable()
    notification
      .integer('alertMessageId')
      .unsigned()
      .references('id')
      .inTable('AlertMessage')
      .onDelete('SET NULL')
    notification
      .integer('emailMessageId')
      .unsigned()
      .references('id')
      .inTable('EmailMessage')
      .onDelete('SET NULL')
    notification
      .integer('smsMessageId')
      .unsigned()
      .references('id')
      .inTable('SmsMessage')
      .onDelete('SET NULL')
    addTimestamps(notification, { update: false })
    notification.charset('utf8')
  })

  // facts-table for result counts by device
  await knex.schema.createTable('FactResultsDevice', x => {
    x
      .integer('deviceId')
      .unsigned()
      .references('id')
      .inTable('Device')
      .notNullable()
      .onDelete('CASCADE')
    x
      .integer('days')
      .unsigned()
      .notNullable()
    x
      .integer('resultCount')
      .unsigned()
      .notNullable()
    x.specificType('calculatedOn', 'DATETIME(3)').notNullable()
    x.unique(['deviceId', 'days'], 'factresultsdevice_unique')
  })

  await knex.schema.createTable('FactResultsDeviceByAssay', x => {
    x
      .integer('deviceId')
      .unsigned()
      .references('id')
      .inTable('Device')
      .notNullable()
      .onDelete('CASCADE')
    x
      .integer('days')
      .unsigned()
      .notNullable()
    x
      .integer('assayId')
      .unsigned()
      .references('id')
      .inTable('Assay')
      .notNullable()
      .onDelete('CASCADE')
    x
      .integer('resultCount')
      .unsigned()
      .notNullable()
    x.specificType('calculatedOn', 'DATETIME(3)').notNullable()
    x.unique(['deviceId', 'assayId', 'days'], 'factresultsdevicebyassay_unique')
  })

  await knex.schema.createTable('FactResultsDeviceByCategory1', x => {
    x
      .integer('deviceId')
      .unsigned()
      .references('id')
      .inTable('Device')
      .notNullable()
      .onDelete('CASCADE')
    x
      .integer('days')
      .unsigned()
      .notNullable()
    x
      .integer('assayId')
      .unsigned()
      .references('id')
      .inTable('Assay')
      .notNullable()
      .onDelete('CASCADE')
    x
      .integer('resultCategory1')
      .unsigned()
      .index()
      .references('id')
      .inTable('ResultCategory')
      .notNullable()
      .onDelete('CASCADE')
    x
      .integer('resultCount')
      .unsigned()
      .notNullable()
    x.specificType('calculatedOn', 'DATETIME(3)').notNullable()
    x.unique(
      ['deviceId', 'assayId', 'resultCategory1', 'days'],
      'factresultsdevicebycategory1_unique'
    )
  })

  await knex.schema.createTable('FactResultsDeviceByCategory1And2', x => {
    x
      .integer('deviceId')
      .unsigned()
      .references('id')
      .inTable('Device')
      .notNullable()
      .onDelete('CASCADE')
    x
      .integer('days')
      .unsigned()
      .notNullable()
    x
      .integer('assayId')
      .unsigned()
      .references('id')
      .inTable('Assay')
      .notNullable()
      .onDelete('CASCADE')
    x
      .integer('resultCategory1')
      .unsigned()
      .index()
      .references('id')
      .inTable('ResultCategory')
      .notNullable()
      .onDelete('CASCADE')
    x
      .integer('resultCategory2')
      .unsigned()
      .index()
      .references('id')
      .inTable('ResultCategory')
      .notNullable()
      .onDelete('CASCADE')
    x
      .integer('resultCount')
      .unsigned()
      .notNullable()
    x.specificType('calculatedOn', 'DATETIME(3)').notNullable()
    x.unique(
      ['deviceId', 'assayId', 'resultCategory1', 'resultCategory2', 'days'],
      'factresultsdevicebycategory1and2_unique'
    )
  })

  // facts-table for device flags
  await knex.schema.createTable('FactDeviceFlag', x => {
    x
      .integer('deviceId')
      .unsigned()
      .references('id')
      .inTable('Device')
      .notNullable()
      .primary()
      .onDelete('CASCADE')
    x
      .boolean('offline')
      .notNullable()
      .defaultTo(0)
    x
      .boolean('noResults')
      .notNullable()
      .defaultTo(0)
    x
      .boolean('service')
      .notNullable()
      .defaultTo(0)
    x
      .boolean('calibration')
      .notNullable()
      .defaultTo(0)
    x
      .boolean('errorRate')
      .notNullable()
      .defaultTo(0)
    x
      .boolean('qcProblem')
      .notNullable()
      .defaultTo(0)
    x
      .boolean('lowInventory')
      .notNullable()
      .defaultTo(0)
    x
      .boolean('outOfInventory')
      .notNullable()
      .defaultTo(0)
    x
      .boolean('expiringInventory')
      .notNullable()
      .defaultTo(0)
    x
      .boolean('expiringWarranty')
      .notNullable()
      .defaultTo(0)
    x.dateTime('updatedOn').notNullable()
  })

  await knex.schema.createTable('Tag', tag => {
    tag.increments('id')
    tag.string('title').notNullable()
    tag
      .integer('partnerId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Partner')
  })

  await knex.schema.createTable('ResultTag', rt => {
    rt
      .integer('resultId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Result')
    rt
      .integer('tagId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Tag')
    rt.primary(['resultId', 'tagId'])
  })

  await knex.schema.createTable('SiteTag', st => {
    st
      .integer('siteId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Site')
    st
      .integer('tagId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Tag')
    st.primary(['siteId', 'tagId'])
  })

  await knex.schema.createTable('DeviceTag', dt => {
    dt
      .integer('deviceId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Device')
    dt
      .integer('tagId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Tag')
    dt.primary(['deviceId', 'tagId'])
  })

  await knex.schema.createTable('PersonTag', pt => {
    pt
      .integer('personId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Person')
    pt
      .integer('tagId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Tag')
    pt.primary(['personId', 'tagId'])
  })

  await knex.schema.createTable('DashboardWidget', widget => {
    widget.increments('id')
    widget.string('title').notNullable()
    widget.string('titleI18nKey').notNullable()
    widget.string('subTitle')
    widget.string('subTitleI18nKey')
    widget.string('sqlForIndicator', 2000).notNullable()
    widget.string('link')
    widget
      .integer('sortOrder')
      .unsigned()
      .notNullable()
    widget.charset('utf8')
  })

  await knex.schema.createTable('DashboardWidgetStat', widget => {
    widget.increments('id')
    widget.string('icon').notNullable()
    widget.string('sqlForStatUnit', 2000)
    widget.string('statUnit')
    widget.string('statUnitI18nKey')
    widget.string('statStatus')
    widget.string('statStatusI18nKey')
    widget.string('sqlForExtra', 2000)
    widget.string('extraUnit')
    widget.string('extraUnitI18nKey')
    widget.string('extraLabel')
    widget.string('extraLabelI18nKey')
    widget
      .integer('dashboardWidgetId')
      .unsigned()
      .index()
      .references('id')
      .inTable('DashboardWidget')
    widget.charset('utf8')
  })

  await knex.schema.createTable('DashboardWidgetTarget', widget => {
    widget.increments('id')
    widget.string('targetToken')
    widget.string('sqlForDataCollection', 2000)
    widget.integer('thresholdPercentageDataCollection')
    widget
      .integer('dashboardWidgetId')
      .unsigned()
      .index()
      .references('id')
      .inTable('DashboardWidget')
    widget.charset('utf8')
  })

  await knex.schema.createTable(
    'JobFunctionDashboardWidget',
    jobFunctionDashboardWidget => {
      jobFunctionDashboardWidget
        .integer('jobFunctionId')
        .unsigned()
        .index()
        .references('id')
        .inTable('JobFunction')
      jobFunctionDashboardWidget
        .integer('widgetId')
        .unsigned()
        .index()
        .references('id')
        .inTable('DashboardWidget')
      jobFunctionDashboardWidget.primary(['widgetId', 'jobFunctionId'])
      jobFunctionDashboardWidget.charset('utf8')
    }
  )

  await knex.schema.createTable('Target', Target => {
    Target.increments('id')
    Target.integer('geographyId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Geography')
    Target.string('targetToken')
    Target.integer('targetValue')
  })

  await knex.raw('SET foreign_key_checks = 1')
}

async function down(knex) {
  await knex.raw('SET foreign_key_checks = 0')

  await knex.schema.dropTableIfExists('InventoryLog')
  await knex.schema.dropTableIfExists('ConsumableAssay')
  await knex.schema.dropTableIfExists('ResultWorkflowLog')
  await knex.schema.dropTableIfExists('ResultWorkflowStatus')
  await knex.schema.dropTableIfExists('ConsumableAssay')
  await knex.schema.dropTableIfExists('InventoryItem')
  await knex.schema.dropTableIfExists('ConsumableReason')
  await knex.schema.dropTableIfExists('Unit')
  await knex.schema.dropTableIfExists('Consumable')
  await knex.schema.dropTableIfExists('ResultCategoryAssay')
  await knex.schema.dropTableIfExists('ResultSource')
  await knex.schema.dropTableIfExists('ResultGeneratedResult')
  await knex.schema.dropTableIfExists('ResultType')
  await knex.schema.dropTableIfExists('ResultCategory')
  await knex.schema.dropTableIfExists('ResultLog')
  await knex.schema.dropTableIfExists('DeviceLog')
  await knex.schema.dropTableIfExists('DeviceLogUpdate')
  await knex.schema.dropTableIfExists('Result')
  await knex.schema.dropTableIfExists('SampleType')
  await knex.schema.dropTableIfExists('Sample')
  await knex.schema.dropTableIfExists('Assay')
  await knex.schema.dropTableIfExists('AssayType')
  await knex.schema.dropTableIfExists('DeviceSiteHistory')
  await knex.schema.dropTableIfExists('Device')
  await knex.schema.dropTableIfExists('DeviceStatusLog')
  await knex.schema.dropTableIfExists('DeviceMaintenanceStatusLog')
  await knex.schema.dropTableIfExists('Site')
  await knex.schema.dropTableIfExists('DeviceTypeCategory')
  await knex.schema.dropTableIfExists('DeviceConfiguration')
  await knex.schema.dropTableIfExists('DeviceOperation')
  await knex.schema.dropTableIfExists('DeviceType')
  await knex.schema.dropTableIfExists('DeviceStatus')
  await knex.schema.dropTableIfExists('DeviceMaintenanceStatus')
  await knex.schema.dropTableIfExists('DeviceRole')
  await knex.schema.dropTableIfExists('DeviceApiKey')
  await knex.schema.dropTableIfExists('RefreshToken')
  await knex.schema.dropTableIfExists('Notification')
  await knex.schema.dropTableIfExists('NotificationType')
  await knex.schema.dropTableIfExists('IssueEvent')
  await knex.schema.dropTableIfExists('IssueEventStatus')
  await knex.schema.dropTableIfExists('IssueEscalationTrigger')
  await knex.schema.dropTableIfExists('Issue')
  await knex.schema.dropTableIfExists('IssueCategory')
  await knex.schema.dropTableIfExists('IssueStatus')
  await knex.schema.dropTableIfExists('IssueStatusLog')
  await knex.schema.dropTableIfExists('IssueType')
  await knex.schema.dropTableIfExists('SmsMessage')
  await knex.schema.dropTableIfExists('SmsTemplate')
  await knex.schema.dropTableIfExists('EmailMessage')
  await knex.schema.dropTableIfExists('EmailTemplate')
  await knex.schema.dropTableIfExists('AlertMessage')
  await knex.schema.dropTableIfExists('AlertTemplate')
  await knex.schema.dropTableIfExists('MessageSeverity')
  await knex.schema.dropTableIfExists('MessageType')
  await knex.schema.dropTableIfExists('MessageStatus')
  await knex.schema.dropTableIfExists('JobFunctionPermission')
  await knex.schema.dropTableIfExists('JobFunction')
  await knex.schema.dropTableIfExists('JobContext')
  await knex.schema.dropTableIfExists('Job')
  await knex.schema.dropTableIfExists('UserRole')
  await knex.schema.dropTableIfExists('RolePermission')
  await knex.schema.dropTableIfExists('Permission')
  await knex.schema.dropTableIfExists('Role')
  await knex.schema.dropTableIfExists('Person')
  await knex.schema.dropTableIfExists('Lga')
  await knex.schema.dropTableIfExists('State')
  await knex.schema.dropTableIfExists('Country')
  await knex.schema.dropTableIfExists('Geography')
  await knex.schema.dropTableIfExists('User')
  await knex.schema.dropTableIfExists('DataFilter')
  await knex.schema.dropTableIfExists('OrgUnit')
  await knex.schema.dropTableIfExists('Partner')
  await knex.schema.dropTableIfExists('PartnerType')
  await knex.schema.dropTableIfExists('DeviceSim')
  await knex.schema.dropTableIfExists('ResultQualityControlLog')
  await knex.schema.dropTableIfExists('FactResultsDevice')
  await knex.schema.dropTableIfExists('FactResultsDeviceByAssay')
  await knex.schema.dropTableIfExists('FactResultsDeviceByCategory1')
  await knex.schema.dropTableIfExists('FactResultsDeviceByCategory1And2')
  await knex.schema.dropTableIfExists('FactDeviceFlag')
  await knex.schema.dropTableIfExists('Tag')
  await knex.schema.dropTableIfExists('ResultTag')
  await knex.schema.dropTableIfExists('SiteTag')
  await knex.schema.dropTableIfExists('DeviceTag')
  await knex.schema.dropTableIfExists('PersonTag')
  await knex.schema.dropTableIfExists('DashboardWidgetStat')
  await knex.schema.dropTableIfExists('DashboardWidgetTarget')
  await knex.schema.dropTableIfExists('DashboardWidget')
  await knex.schema.dropTableIfExists('JobFunctionDashboardWidget')
  await knex.schema.dropTableIfExists('Target')
  await knex.schema.dropTableIfExists('Feature')
  await knex.schema.dropTableIfExists('JobFunctionFeature')

  await knex.raw('SET foreign_key_checks = 1')
}
