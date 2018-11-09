const _ = require('lodash')
const { knex } = require('../db')
const { distanceInWordsStrict } = require('date-fns')
const { parseDateOrDefault, formatDateOrDefault } = require('../shared/date')
const { loadPlugin } = require('../plugin/registration')
const handlebars = require('handlebars')

handlebars.registerHelper('numberOfDays', numberOfDays)
handlebars.registerHelper('isoDate', isoDate)
handlebars.registerHelper('formatDate', formatDate)
handlebars.registerHelper('toLowerCase', toLowerCase)
handlebars.registerHelper('mapValue', mapValue)
handlebars.registerHelper('defaultTo', defaultTo)

// See unit tests for examples
// Can include displayPreferences
function processUsingHandlebarsSyntax(inputString, data = {}) {
  const template = handlebars.compile(inputString)
  return template(data)
}

function getMustacheTokensInString(inputString) {
  return inputString.match(/{{\s*[\w.[\]\s]+\s*}}/g)
}

function addDataSourceToQuery(queryBuilder, aliases) {
  // TODO generalize to other aliases and make joined tables and field names unique
  // similar to auth/constraints
  const { message, notification } = aliases

  if (message != null) {
    queryBuilder
      .leftJoin('Person as p', `${message}.personId`, 'p.id')
      .leftJoin('Site as s', `${message}.siteId`, 's.id')
      .leftJoin('Device as d', `${message}.deviceId`, 'd.id')
      .leftJoin('DeviceType as dt', `d.deviceTypeId`, 'dt.id')
      .leftJoin('Result as r', `${message}.resultId`, 'r.id')
      .leftJoin('Assay as a', `r.assayId`, 'a.id')
      .leftJoin('Sample as sample', `r.sampleId`, 'sample.id')
      .leftJoin('ResultCategory as rc1', `r.resultCategory1`, 'rc1.id')
      .leftJoin('ResultCategory as rc2', `r.resultCategory2`, 'rc1.id')
      .leftJoin('Partner as pu', 'pu.id', 'p.lastPartnerId')
      .select(
        's.externalId as siteExternalId',
        's.name as siteName',
        's.shortName as siteShortName',
        'p.name as personName',
        'p.cell as personCell',
        'pu.plugin as partnerPlugin',
        'd.lastPingOn as deviceLastPingOn',
        'd.lastSeenOn as deviceLastSeenOn',
        'dt.externalId as deviceTypeExternalId',
        'r.resultData',
        'r.patientData as resultPatientData',
        'r.formData as resultFormData',
        'r.startedOn as resultStartedOn',
        'r.endedOn as resultEndedOn',
        knex.raw('coalesce(r.moduleName, r.moduleSerial) as resultModuleName'),
        'r.moduleSerial as resultModuleSerial',
        'r.errorCode as resultErrorCode',
        'r.errorNotes as resultErrorNotes',
        'a.externalId as assayExternalId',
        'sample.externalId as sampleExternalId',
        'rc1.externalId as resultCategory1ExternalId',
        'rc2.externalId as resultCategory2ExternalId'
      )
  }

  if (notification != null) {
    queryBuilder
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

  return queryBuilder
}

async function processUsingDataSourceQuery(data, templateFields, options = {}) {
  const ds = await getBaseDataSource(data)
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

async function getBaseDataSource(data) {
  const d = data || {}
  const { displayPreferences = {} } = await loadPlugin(
    [d.partnerPlugin],
    'settings'
  )
  return {
    site: {
      id: d.siteExternalId,
      name: d.siteName,
      shortName: d.siteShortName,
    },
    device: {
      name: d.deviceName,
      deviceType: d.deviceTypeExternalId,
      lastSeenOn: d.deviceLastSeenOn,
      lastPingOn: d.deviceLastPingOn,
    },
    result: {
      data: d.resultData == null ? {} : JSON.parse(d.resultData),
      formData: d.resultFormData == null ? {} : JSON.parse(d.resultFormData),
      patient:
        d.resultPatientData == null ? {} : JSON.parse(d.resultPatientData),
      startedOn: d.resultStartedOn,
      endedOn: d.resultEndedOn,
      moduleName: d.resultModuleName,
      moduleSerial: d.resultModuleSerial,
      errorCode: d.resultErrorCode,
      errorNotes: d.resultErrorNotes,
      assay: {
        id: d.assayExternalId,
      },
      sample: {
        id: d.sampleExternalId,
      },
      category1: {
        id: d.resultCategory1ExternalId,
      },
      category2: {
        id: d.resultCategory2ExternalId,
      },
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
    displayPreferences,
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

function formatDate(date, options) {
  const dateFormat =
    options.hash.formatString ||
    _.get(this, 'displayPreferences.dateFormat', 'YYYY-MM-DD')
  return formatDateOrDefault(date, dateFormat)
}

function toLowerCase(stringValue) {
  if (stringValue) {
    return stringValue.toLowerCase()
  }
  return stringValue
}

function mapValue(value, options) {
  if (options.hash.valueMap) {
    return JSON.parse(options.hash.valueMap)[value]
  }
  return value
}

function defaultTo(value, options) {
  let defaultValue
  if (typeof options === 'string') {
    defaultValue = options
  } else {
    defaultValue = _.get(options, ['hash', 'value'])
  }
  return value || defaultValue
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
