module.exports = require('../src/db').migration(up, down)

const {
  addCreateFieldsNullable,
  addUpdateFieldsNullable,
  addTimestamps,
} = require('./utils/index')

async function up(knex) {
  await knex.schema.table('Partner', x => {
    x.integer('dueDaysInventoryStockout')
    x.integer('dueDaysInventoryStockExpiring')
  })

  await knex.schema.createTable('FactInventoryConsumptionRate', x => {
    x
      .integer('siteId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('Site')
    x
      .integer('consumableId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('Consumable')
    x
      .integer('days')
      .unsigned()
      .notNullable()
    // for 'rate' use float - because daily rate is calculated as "totals for last 10 days with at least 1 test"/10
    x.float('rate').notNullable()
    x.dateTime('updatedOn').notNullable()
    x.primary(['siteId', 'consumableId', 'days'])
  })

  await knex.schema.createTable('IssueStatusSeverity', issueStatusSeverity => {
    issueStatusSeverity.increments('id')
    issueStatusSeverity.string('name').notNullable()
    issueStatusSeverity.string('i18nKey').notNullable()
    issueStatusSeverity.string('externalId').notNullable()
    issueStatusSeverity
      .integer('sortOrder')
      .unsigned()
      .notNullable()
    issueStatusSeverity.charset('utf8')
  })

  await knex('IssueStatusSeverity').insert({
    name: 'High',
    i18nKey: 'issueStatusSeverityHigh',
    externalId: 'High',
    sortOrder: 0,
  })

  await knex('IssueStatusSeverity').insert({
    name: 'Medium',
    i18nKey: 'issueStatusSeverityMedium',
    externalId: 'Medium',
    sortOrder: 1,
  })

  const [issueStatusSeverityIdLow] = await knex('IssueStatusSeverity').insert({
    name: 'Low',
    i18nKey: 'issueStatusSeverityLow',
    externalId: 'Low',
    sortOrder: 2,
  })

  await knex.schema.table('IssueStatus', issueStatus => {
    issueStatus
      .integer('issueStatusSeverityId')
      .unsigned()
      .notNullable()
      .defaultTo(issueStatusSeverityIdLow)
      .references('id')
      .inTable('IssueStatusSeverity')
    issueStatus
      .integer('sortOrder')
      .unsigned()
      .notNullable()
      .defaultTo(0)
  })

  await knex.schema.createTable('FileContentType', fileContentType => {
    fileContentType.increments('id')
    fileContentType.string('name').notNullable()
    fileContentType
      .string('externalId')
      .notNullable()
      .index()
      .unique()
    // text | image | audio | video | application
    fileContentType.string('mimeType')
    // plain html | png jpeg | mpeg | webm | json octet-stream
    fileContentType.string('mimeSubtype')
    fileContentType.charset('utf8')
  })

  await knex.schema.createTable('FileReference', fileReference => {
    fileReference.increments('id')
    fileReference
      .integer('fileContentTypeId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('FileContentType')
    fileReference.string('name').notNullable()
    fileReference.integer('length')
    addCreateFieldsNullable(fileReference)
    addUpdateFieldsNullable(fileReference)
    fileReference.charset('utf8')
  })

  await knex.schema.createTable('ResultFileReference', resultFileReference => {
    resultFileReference
      .integer('resultId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('Result')
    resultFileReference
      .integer('fileReferenceId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('FileReference')
    resultFileReference.primary(['resultId', 'fileReferenceId'])
    resultFileReference.charset('utf8')
  })

  await knex.schema.createTable('WebhookTemplate', webhookTemplate => {
    webhookTemplate.increments('id')
    webhookTemplate.string('externalId')
    // GET | PUT | POST
    webhookTemplate.string('method').notNullable()
    // Prepend all templated URLs with base, can be null to use URL only
    webhookTemplate.string('urlBase')
    // https://endpoint.com/path add query string to params
    // relative to base if non null
    webhookTemplate.string('url').notNullable()
    // headers as { 'headerName': 'headerValue'}
    webhookTemplate.specificType('headers', 'JSON')
    // If method=GET Query string values as { 'queryName': 'queryValue')
    // If method=POST|PUT string values as post data
    webhookTemplate.specificType('params', 'JSON')
    // Payload template for POST|PUT null | templateData
    // Should not set both payload and params
    webhookTemplate.text('payload')
    webhookTemplate
      .integer('fileContentTypeId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('FileContentType')
    // set file name if we should download response and create file reference
    webhookTemplate.string('fileName')
    addCreateFieldsNullable(webhookTemplate)
    addUpdateFieldsNullable(webhookTemplate)
    webhookTemplate.charset('utf8')
  })

  await knex.schema.createTable('WebhookMessage', webhookMessage => {
    webhookMessage.increments('id')
    webhookMessage
      .integer('webhookTemplateId')
      .unsigned()
      .references('id')
      .inTable('WebhookTemplate')
      .notNullable()
    webhookMessage
      .integer('messageStatusId')
      .unsigned()
      .references('id')
      .inTable('MessageStatus')
      .notNullable()
    webhookMessage
      .integer('personId')
      .unsigned()
      .references('id')
      .inTable('Person')
    webhookMessage
      .integer('siteId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Site')
    webhookMessage
      .integer('deviceId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Device')
    webhookMessage
      .integer('resultId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Result')
    webhookMessage
      .integer('fileReferenceId')
      .unsigned()
      .index()
      .references('id')
      .inTable('FileReference')
    // Full URL with template vars replaced
    webhookMessage.string('url')
    webhookMessage.specificType('headers', 'JSON')
    webhookMessage.specificType('params', 'JSON')
    webhookMessage.text('payload')
    addTimestamps(webhookMessage)
    webhookMessage.charset('utf8')
  })

  await knex.schema.table('MessageType', messageType => {
    messageType
      .integer('webhookTemplateId')
      .unsigned()
      .references('id')
      .inTable('WebhookTemplate')
  })

  await knex.schema.table('Notification', notification => {
    notification
      .integer('webhookMessageId')
      .unsigned()
      .references('id')
      .inTable('WebhookMessage')
  })
}

async function down(knex) {
  await knex.schema.table('Partner', x => {
    x.dropColumns('dueDaysInventoryStockout', 'dueDaysInventoryStockExpiring')
  })

  await knex.schema.dropTableIfExists('FactInventoryConsumptionRate')

  await knex.schema.table('IssueStatus', issueStatus => {
    issueStatus.dropForeign('issueStatusSeverityId')
    issueStatus.dropColumns('issueStatusSeverityId')
    issueStatus.dropColumns('sortOrder')
  })

  await knex.schema.dropTableIfExists('IssueStatusSeverity')

  await knex.schema.table('MessageType', messageType => {
    messageType.dropForeign('webhookTemplateId').dropColumn('webhookTemplateId')
  })
  await knex.schema.table('Notification', notification => {
    notification.dropForeign('webhookMessageId').dropColumn('webhookMessageId')
  })
  await knex.schema.dropTableIfExists('WebhookMessage')
  await knex.schema.dropTableIfExists('WebhookTemplate')
  await knex.schema.dropTableIfExists('ResultFileReference')
  await knex.schema.dropTableIfExists('FileReference')
  await knex.schema.dropTableIfExists('FileContentType')
}
