const handlebars = require('handlebars')

handlebars.registerHelper('numberOfDays', numberOfDays)

// See unit tests for examples
function processUsingHandlebarsSyntax(inputString, data = {}) {
  const template = handlebars.compile(inputString)
  return template(data)
}

function getMustacheTokensInString(inputString) {
  return inputString.match(/{{\s*[\w.[\]\s]+\s*}}/g)
}

async function createSmsMessageFromTemplate(knex, smsMessageId) {
  const data = await knex('SmsMessage as m')
    .innerJoin('SmsTemplate as tmpl', 'm.smsTemplateId', 'tmpl.id')
    .modify(addDataSourceToQuery, { message: 'm' })
    .where({ 'm.id': smsMessageId })
    .first('tmpl.message as messageTemplate')

  // merge template with data
  const { messageTemplate = '' } = data || {}
  return processUsingHandlebarsSyntax(messageTemplate, getBaseDataSource(data))
}

async function createAlertMessageFromTemplate(knex, alertMessageId) {
  const data = await knex('AlertMessage as m')
    .innerJoin('AlertTemplate as tmpl', 'm.alertTemplateId', 'tmpl.id')
    .modify(addDataSourceToQuery, { message: 'm' })
    .where({ 'm.id': alertMessageId })
    .first('tmpl.message as messageTemplate')

  // merge template with data
  const { messageTemplate = '' } = data || {}
  return processUsingHandlebarsSyntax(messageTemplate, getBaseDataSource(data))
}

async function createEmailFieldsFromTemplate(knex, emailMessageId) {
  const data = await knex('EmailMessage as m')
    .innerJoin('EmailTemplate as tmpl', 'm.emailTemplateId', 'tmpl.id')
    .modify(addDataSourceToQuery, { message: 'm' })
    .where({ 'm.id': emailMessageId })
    .first(
      'tmpl.subject as subjectTemplate',
      'tmpl.body as bodyTemplate',
      'tmpl.htmlBody as htmlBodyTemplate'
    )

  const { subjectTemplate = '', bodyTemplate = '', htmlBodyTemplate = '' } =
    data || {}

  // merge template with data
  const ds = getBaseDataSource(data)
  const subject = processUsingHandlebarsSyntax(subjectTemplate, ds)
  const body = processUsingHandlebarsSyntax(bodyTemplate, ds)
  const htmlBody = processUsingHandlebarsSyntax(htmlBodyTemplate, ds)

  return { subject, body, htmlBody }
}

function addDataSourceToQuery(qb, aliases) {
  // TODO generalize to other aliases and make joined aliases unique
  // similar to auth/constraints
  const { message } = aliases
  return qb
    .innerJoin('Person as p', `${message}.personId`, 'p.id')
    .leftJoin('Site as s', `${message}.siteId`, 's.id')
    .leftJoin('Device as d', `${message}.deviceId`, 'd.id')
    .leftJoin('Result as r', `${message}.resultId`, 'r.id')
    .select(
      'm.personId',
      'm.siteId',
      'm.deviceId',
      'm.resultId',
      's.name as siteName',
      's.shortName as siteShortName',
      'p.name as personName'
    )
}

function getBaseDataSource(data) {
  const d = data || {}
  return {
    site: {
      id: d.siteId,
      name: d.siteName,
      shortName: d.siteShortName,
    },
    device: {
      id: d.deviceId,
      name: d.deviceName,
      lastPingOn: '2018-05-29',
    },
    result: {
      externalId: d.externalId,
    },
    person: {
      name: d.personName,
    },
  }
}

// helpers
function numberOfDays(date) {
  if (date == null) {
    return ''
  }
  return new Date(date).toLocaleString()
}

module.exports = {
  processUsingHandlebarsSyntax,
  getMustacheTokensInString,
  createAlertMessageFromTemplate,
  createSmsMessageFromTemplate,
  createEmailFieldsFromTemplate,
}
