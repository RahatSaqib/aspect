const { knex } = require('../db')
const { distanceInWordsStrict } = require('date-fns')
const {
  parseDateOrDefault,
  formatDate: formatDateOrDefault,
} = require('../shared/date')
const handlebars = require('handlebars')

handlebars.registerHelper('numberOfDays', numberOfDays)
handlebars.registerHelper('isoDate', isoDate)
handlebars.registerHelper('formatDate', formatDate)

// See unit tests for examples
// Can include options in data to process, including
//   dateFormat, culture
function processUsingHandlebarsSyntax(inputString, data = {}) {
  const template = handlebars.compile(inputString)
  return template(data)
}

function getMustacheTokensInString(inputString) {
  return inputString.match(/{{\s*[\w.[\]\s]+\s*}}/g)
}

function addDataSourceToQuery(qb, aliases) {
  // TODO generalize to other aliases and make joined tables and field names unique
  // similar to auth/constraints
  const { message, notification } = aliases

  if (message != null) {
    qb
      .leftJoin('Person as p', `${message}.personId`, 'p.id')
      .leftJoin('Site as s', `${message}.siteId`, 's.id')
      .leftJoin('Device as d', `${message}.deviceId`, 'd.id')
      .leftJoin('Result as r', `${message}.resultId`, 'r.id')
      .leftJoin('Geography as pg', 'p.geographyId', 'pg.id')
      .leftJoin('Country as pc', 'pg.countryId', 'pc.id')
      .select(
        's.name as siteName',
        's.shortName as siteShortName',
        'p.name as personName',
        'p.cell as personCell',
        'p.dateFormat as personDateFormat',
        'pc.culture as personCulture',
        'd.lastPingOn as deviceLastPingOn',
        'd.lastSeenOn as deviceLastSeenOn',
        'r.resultData',
        'r.patientData as resultPatientData',
        knex.raw('coalesce(r.moduleName, r.moduleSerial) as resultModuleName'),
        'r.moduleSerial as resultModuleSerial',
        'r.errorCode as resultErrorCode',
        'r.errorNotes as resultErrorNotes'
      )
  }

  if (notification != null) {
    qb
      .leftJoin('Issue as i', `${notification}.issueId`, 'i.id')
      .leftJoin(
        'NotificationType as nt',
        `${notification}.notificationTypeId`,
        'nt.id'
      )
      .select(
        'i.createdOn as issueCreatedOn',
        'i.dueOn as issueDueOn',
        'i.data as issueData',
        'nt.name as notificationTypeName'
      )
  }

  return qb
}

function processUsingDataSourceQuery(data, templateFields, options = {}) {
  const ds = getBaseDataSource(data)
  return templateFields.reduce((memo, field) => {
    const fieldName = field.replace(/template/i, '')
    const template = (data && data[field]) || ''
    let message
    if (options.dynamic) {
      message = processUsingDynamicHelpers(template, ds)
    } else {
      message = processUsingHandlebarsSyntax(template, ds)
    }
    memo[fieldName] = message
    return memo
  }, {})
}

function getBaseDataSource(data) {
  const d = data || {}
  return {
    site: {
      name: d.siteName,
      shortName: d.siteShortName,
    },
    device: {
      name: d.deviceName,
      lastSeenOn: d.deviceLastSeenOn,
      lastPingOn: d.deviceLastPingOn,
    },
    result: {
      data: d.resultData == null ? {} : JSON.parse(d.resultData),
      patient:
        d.resultPatientData == null ? {} : JSON.parse(d.resultPatientData),
      moduleName: d.resultModuleName,
      moduleSerial: d.resultModuleSerial,
      errorCode: d.resultErrorCode,
      errorNotes: d.resultErrorNotes,
    },
    person: {
      name: d.personName,
      cell: d.personCell,
    },
    issue: {
      createdOn: d.issueCreatedOn,
      dueOn: d.issueDueOn,
      data: d.issueData == null ? {} : JSON.parse(d.issueData),
    },
    notification: {
      type: d.notificationTypeName,
    },
    options: {
      culture: d.personCulture,
      dateFormat: d.personDateFormat,
    },
  }
}

function processDynamicMessage(message) {
  // See processUsingDynamicHelpers, and
  // processUsingDataSourceQuery with { dyanmic: true }
  // currently no additional processing is needed but aliased
  // in case that changes so users can signify intent
  return processUsingHandlebarsSyntax(message, {})
}

// helpers
function processUsingDynamicHelpers(template, ds) {
  const dynamicTemplate = template.replace(
    /{{\s*numberOfDays\s+([\w.[\]\s]+)\s*}}/g,
    (str, match) =>
      `\${openMustaches}numberOfDays "{{isoDate ${match}}}"\${closeMustaches}`
  )
  const message = processUsingHandlebarsSyntax(dynamicTemplate, ds)
  return message
    .replace(/\${openMustaches}/g, '{{')
    .replace(/\${closeMustaches}/g, '}}')
}

function numberOfDays(date) {
  if (date == null || date === '') {
    return 'days'
  }
  return distanceInWordsStrict(new Date(), date, {
    unit: 'd',
    partialMethod: 'ceil',
  })
}

function isoDate(date) {
  const parsed = parseDateOrDefault(date)
  return parsed == null ? null : parsed.toISOString()
}

function formatDate(date) {
  return formatDateOrDefault(date, this.options)
}

module.exports = {
  processUsingHandlebarsSyntax,
  getMustacheTokensInString,
  addDataSourceToQuery,
  processUsingDataSourceQuery,
  processDynamicMessage,
  numberOfDays,
  isoDate,
  formatDate,
}
