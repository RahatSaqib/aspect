module.exports = require('../src/db').migration(up, down)

const {
  addCreateFieldsNullable,
  addUpdateFieldsNullable,
  addTimestamps,
} = require('./utils/index')

async function up(knex) {
  await knex.schema.createTable('FileContentType', fileContentType => {
    fileContentType.increments('id')
    fileContentType.string('name').notNullable()
    fileContentType.string('externalId').notNullable()
    fileContentType.string('mimeType').notNullable()
    fileContentType
      .boolean('isImage')
      .notNullable()
      .defaultTo(0)
    addTimestamps(fileContentType)
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

  await knex.schema.createTable('ResultAttachment', resultAttachment => {
    resultAttachment.increments('id')
    resultAttachment
      .integer('resultId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('Result')
    resultAttachment
      .integer('fileReferenceId')
      .unsigned()
      .notNullable()
      .index()
      .references('id')
      .inTable('FileReference')
    resultAttachment.string('name')
    resultAttachment.string('contentType')
    addCreateFieldsNullable(resultAttachment)
    addUpdateFieldsNullable(resultAttachment)
    resultAttachment.charset('utf8')
  })

  await knex.schema.createTable('WebhookTemplate', webhookTemplate => {
    webhookTemplate.increments('id')
    webhookTemplate.string('externalId')
    // GET | PUT | POST
    webhookTemplate.string('method').notNullable()
    // https://endpoint.com/path add query string to query
    webhookTemplate.string('url').notNullable()
    // Query string values as { 'queryName': 'queryValue')
    webhookTemplate.specificType('query', 'JSON')
    // headers as { 'headerName': 'headerValue'}
    webhookTemplate.specificType('headers', 'JSON')
    // Payload template null | templateData
    webhookTemplate.text('payload')
    // Configuration of response handler
    // null | { action: 'addResultAttachment' }
    webhookTemplate.specificType('responseHandler', 'JSON')
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
    // Full URL with template vars replaced and query string appended
    webhookMessage.string('url')
    webhookMessage.specificType('headers', 'JSON')
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
  await knex.schema.table('MessageType', messageType => {
    messageType.dropForeign('webhookTemplateId').dropColumn('webhookTemplateId')
  })
  await knex.schema.table('Notification', notification => {
    notification.dropForeign('webhookMessageId').dropColumn('webhookMessageId')
  })
  await knex.schema.dropTableIfExists('WebhookMessage')
  await knex.schema.dropTableIfExists('WebhookTemplate')
  await knex.schema.dropTableIfExists('ResultAttachment')
  await knex.schema.dropTableIfExists('FileReference')
  await knex.schema.dropTableIfExists('FileContentType')
}
