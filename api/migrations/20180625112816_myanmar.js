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
      .inTable('FileRefernce')
    resultAttachment.string('name')
    resultAttachment.string('contentType')
    addCreateFieldsNullable(resultAttachment)
    addUpdateFieldsNullable(resultAttachment)
    resultAttachment.charset('utf8')
  })

  await knex.schema.createTable('WebhookCredentials', webhookCredentials => {
    webhookCredentials.increments('id')
    // null | { user: '', password: ''}
    webhookCredentials.specificType('authBasic', 'JSON')
    // null | { 'Authorization': 'Token 123' }
    webhookCredentials.specificType('headers', 'JSON')
    // null | { 'token': 'Token234' }
    webhookCredentials.specificType('query', 'JSON')
    addCreateFieldsNullable(webhookCredentials)
    addUpdateFieldsNullable(webhookCredentials)
    webhookCredentials.charset('utf8')
  })

  await knex.schema.createTable('WebhookTemplate', webhookTemplate => {
    webhookTemplate.increments('id')
    // GET | PUT | POST
    webhookTemplate.string('method').notNullable()
    // https://endpoint.com/path add query string to query
    webhookTemplate.string('url').notNullable()
    // any additional headers, if Authorization, prefer adding to WebhookCredentials
    webhookTemplate.specificType('query', 'JSON')
    // any additional headers, if Authorization, prefer adding to WebhookCredentials
    webhookTemplate.specificType('headers', 'JSON')
    // Payload template null | templateData
    webhookTemplate.text('payload')
    // Configuration of response handler
    // null | { action: 'addResultAttachment' }
    webhookTemplate.specificType('responseHandler', 'JSON')
    // Credentials for this template, nullable
    webhookTemplate
      .integer('webhookCredentialsId')
      .unsigned()
      .references('id')
      .inTable('WebhookCredentials')
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
      .notNullable()
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
      .inTable('FileRefernce')
    // Full URL with template vars replaced and query string appended
    webhookMessage.string('url')
    webhookMessage.specificType('headers', 'JSON')
    webhookMessage.text('payload')
    addTimestamps(webhookMessage)
    webhookMessage.charset('utf8')
  })
}

async function down(knex) {
  await knex.schema.dropTableIfExists('WebhookMessage')
  await knex.schema.dropTableIfExists('WebhookTemplate')
  await knex.schema.dropTableIfExists('WebhookCredentials')
  await knex.schema.dropTableIfExists('ResultAttachment')
  await knex.schema.dropTableIfExists('FileReference')
  await knex.schema.dropTableIfExists('FileContentType')
}
