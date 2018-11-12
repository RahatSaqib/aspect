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
handlebars.registerHelper('enclose', enclose)
handlebars.registerHelper('escapeLines', escapeLines)
handlebars.registerHelper('urlEncode', urlEncode)
handlebars.registerHelper('tryMergeResultCategories', tryMergeResultCategories)
handlebars.registerHelper('isRegexMatch', isRegexMatch)
handlebars.registerHelper(
  'extractValueFromRegexCaptureGroup',
  extractValueFromRegexCaptureGroup
)
handlebars.registerHelper('toInt', toInt)
handlebars.registerHelper('maxViralLoadValue', maxViralLoadValue)
handlebars.registerHelper({
  eq: (v1, v2) => v1 === v2,
  ne: (v1, v2) => v1 !== v2,
  lt: (v1, v2) => v1 < v2,
  gt: (v1, v2) => v1 > v2,
  lte: (v1, v2) => v1 <= v2,
  gte: (v1, v2) => v1 >= v2,
  and: (...rest) => Array.prototype.slice.call(rest).every(Boolean),
  or: (...rest) => Array.prototype.slice.call(rest, 0, -1).some(Boolean),
})

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
        'r.notes as resultNotes',
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
      notes: d.resultNotes,
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

function getArgumentFromOptions(options, keyInOptionsHash) {
  if (typeof options === 'string') {
    return options
  }
  return _.get(options, ['hash', keyInOptionsHash])
}

function formatDate(date, options) {
  if (_.isNil(date)) {
    return date
  }
  const dateFormat =
    getArgumentFromOptions(options, 'formatString') ||
    _.get(this, 'displayPreferences.dateFormat', 'YYYY-MM-DD')
  return formatDateOrDefault(date, dateFormat)
}

function toLowerCase(stringValue) {
  if (stringValue) {
    if (stringValue instanceof handlebars.SafeString) {
      return safeString(stringValue.string.toLowerCase())
    }
    return safeString(stringValue.toLowerCase())
  }
  return stringValue
}

function safeString(value) {
  if (
    _.isNil(value) ||
    value instanceof handlebars.SafeString ||
    typeof value !== 'string'
  ) {
    return value
  }
  return new handlebars.SafeString(value)
}

function rawString(value) {
  let rawValue = value
  if (value instanceof handlebars.SafeString) {
    rawValue = value.string
  }
  return rawValue
}

function mapValue(value, options) {
  const rawValue = rawString(value)
  const valueMapString = getArgumentFromOptions(options, 'valueMap')
  if (valueMapString) {
    return safeString(JSON.parse(valueMapString)[rawValue])
  }
  return safeString(value)
}

function defaultTo(value, options) {
  const rawValue = rawString(value)
  const defaultValue = getArgumentFromOptions(options, 'value')
  return safeString(rawValue || defaultValue)
}

function enclose(value, options) {
  const rawValue = rawString(value)
  if (_.isNil(rawValue)) {
    return value
  }
  const encloseWith = getArgumentFromOptions(options, 'with')
  return safeString(`${encloseWith}${rawValue}${encloseWith}`)
}

function escapeLines(value) {
  const rawValue = rawString(value)
  if (!rawValue || rawValue.indexOf('\n') < 0) {
    return safeString(value)
  }
  return safeString(
    _.map(rawValue.split('\n'), line => line.trim()).join('\\n')
  )
}

function urlEncode(value) {
  const rawValue = rawString(value)
  if (_.isNil(rawValue)) {
    return value
  }
  return safeString(encodeURIComponent(rawValue))
}

function priorityResult(resultCategories, resultCateoryId) {
  if (resultCategories.includes(resultCateoryId)) {
    return resultCateoryId
  }
}

function tryMergeResultCategories(resultCategory1, resultCategory2) {
  const resultCategories = [resultCategory1, resultCategory2]
  const orderedPriorityCategories = [
    'Error',
    'Discordant',
    'Detected',
    'MoreThan1000',
    'LessThan1000',
    'Trace Detected',
    'NotDetected',
    'Invalid',
    'Indeterminate',
    'NoResult',
  ]
  for (let i = 0; i < orderedPriorityCategories.length; i++) {
    const foundPriorityCategory = priorityResult(
      resultCategories,
      orderedPriorityCategories
    )
    if (foundPriorityCategory) {
      return foundPriorityCategory
    }
  }
  return resultCategory1 || resultCategory2
}

function isRegexMatch(stringValue, options) {
  const rawValue = rawString(stringValue)
  if (!_.isNil(rawValue)) {
    const expression = getArgumentFromOptions(options, 'expression')
    if (expression) {
      const regex = new RegExp(expression, 'g')
      return !_.isNull(stringValue.match(regex))
    }
  }
}

function extractValueFromRegexCaptureGroup(stringValue, options) {
  const rawValue = rawString(stringValue)
  if (!_.isNil(rawValue)) {
    const expression = getArgumentFromOptions(options, 'expression')
    const groupNumber = _.get(options, ['hash', 'groupNumber'], 1)
    if (expression) {
      const regex = new RegExp(expression, 'g')
      const match = regex.exec(stringValue)
      if (match && match.length > groupNumber) {
        return safeString(match[groupNumber])
      }
    }
  }
}

function toInt(value) {
  const rawValue = rawString(value)
  if (!_.isNil(rawValue)) {
    return parseInt(rawValue, 10)
  }
}

function extractNumericViralLoadValue(value) {
  let rawValue = value
  if (_.isNil(rawValue)) {
    rawValue = 0
  } else {
    rawValue = rawString(value)
  }
  if (typeof rawValue === 'number') {
    return { numericValue: rawValue, text: rawValue.toString() }
  }
  if (typeof rawValue === 'string') {
    const numericStringValue = (
      rawString(
        extractValueFromRegexCaptureGroup(rawValue, '([\\d|\\s|\\.]+)')
      ) || ''
    ).trim()
    const numericStringValueWithoutWhiteSpace = numericStringValue.replace(
      /\s/,
      ''
    )
    const numericValue = parseFloat(numericStringValueWithoutWhiteSpace)
    if (!isNaN(numericValue)) {
      if (isRegexMatch(rawValue, '>[\\d|\\s|\\.]+')) {
        return {
          numericValue: numericValue + 1,
          text: `> ${numericStringValue}`,
        }
      } else if (isRegexMatch(rawValue, '<[\\d|\\s|\\.]+')) {
        return {
          numericValue: numericValue - 1,
          text: `< ${numericStringValue}`,
        }
      }
      return { numericValue, text: numericValue.toString() }
    }
  }
}

function maxViralLoadValue(...rest) {
  const maxViralLoadValue = _.maxBy(
    _.map(rest.slice(0, -1), arg => extractNumericViralLoadValue(arg)),
    viralLoad => _.get(viralLoad, 'numericValue')
  )
  return safeString(_.get(maxViralLoadValue, 'text'))
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
