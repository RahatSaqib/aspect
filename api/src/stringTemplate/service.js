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

function processUsingDataSourceQuery(data, templateFields) {
  const ds = getBaseDataSource(data)
  return templateFields.reduce((memo, field) => {
    const template = (data && data[field]) || ''
    const fieldName = field.replace(/template/i, '')
    memo[fieldName] = processUsingHandlebarsSyntax(template, ds)
    return memo
  }, {})
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
  addDataSourceToQuery,
  processUsingDataSourceQuery,
}
