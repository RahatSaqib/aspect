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

const mergeTemplateData = processUsingHandlebarsSyntax

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
  mergeTemplateData,
  getBaseDataSource,
}
