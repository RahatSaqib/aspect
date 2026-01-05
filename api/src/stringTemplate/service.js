const _ = require('lodash')
const { formatDistanceStrict, parseISO, format } = require('date-fns')
const { findTimeZone } = require('timezone-support')
const { convertToTimeZone } = require('date-fns-timezone')
const handlebars = require('handlebars')
const { knex } = require('../db')
const {
  parseDateOrDefault,
  formatDateOrDefault,
  getFormattedDateTimeWithTimezone,
  getFormattedDate,
  daysBetweenDates,
  getDateInMilliSeconds,
} = require('../shared/date')
const { addConstraints } = require('../auth/constraints')
const getCurrentPartner = require('../partner/getCurrentPartner')
const { getDateRangeFilters } = require('../notification/common/logic')
const { oneDirectionalMd5Hash } = require('../shared/encryption')

handlebars.registerHelper('curly', curlyBrace)
handlebars.registerHelper('square', squareBrace)
handlebars.registerHelper('numberOfDays', numberOfDays)
handlebars.registerHelper('getDateInMilliSeconds', getDateInMilliSeconds)
handlebars.registerHelper('isoDate', isoDate)
handlebars.registerHelper('localizedDateTime', localizedDateTime)
handlebars.registerHelper('localizedDate', localizedDate)
handlebars.registerHelper('daysBeforeToday', daysFromToday)
handlebars.registerHelper('offsetToTimeZone', offsetToTimeZone)
handlebars.registerHelper('formatDate', formatDate)
handlebars.registerHelper('formatPhone', formatPhone)
handlebars.registerHelper('toLowerCase', toLowerCase)
handlebars.registerHelper('mapValue', mapValue)
handlebars.registerHelper('defaultTo', defaultTo)
handlebars.registerHelper('enclose', enclose)
handlebars.registerHelper('escapeLines', escapeLines)
handlebars.registerHelper('urlEncode', urlEncode)
handlebars.registerHelper('tryMergeResultCategories', tryMergeResultCategories)
handlebars.registerHelper('isRegexMatch', isRegexMatch)
handlebars.registerHelper('extractValueFromRegexCaptureGroup', extractValueFromRegexCaptureGroup)
handlebars.registerHelper('toInt', toInt)
handlebars.registerHelper('maxViralLoadValue', maxViralLoadValue)
handlebars.registerHelper({
  eq: (v1, v2) => rawValue(v1) === rawValue(v2),
  ne: (v1, v2) => rawValue(v1) !== rawValue(v2),
  lt: (v1, v2) => rawValue(v1) < rawValue(v2),
  gt: (v1, v2) => rawValue(v1) > rawValue(v2),
  lte: (v1, v2) => rawValue(v1) <= rawValue(v2),
  gte: (v1, v2) => rawValue(v1) >= rawValue(v2),
  and: (...rest) => Array.prototype.slice.call(rest).every(Boolean),
  or: (...rest) => Array.prototype.slice.call(rest, 0, -1).some(Boolean),
})
handlebars.registerHelper('customFieldValueFromLabel', customFieldValueFromLabel)
handlebars.registerHelper('coalesce', coalesce)
handlebars.registerHelper('oneDirectionalMd5Hash', oneDirectionalMd5Hash)

// See unit tests for examples
// Can include displayPreferences
function processUsingHandlebarsSyntax(inputString, data = {}) {
  const template = handlebars.compile(inputString)
  return template(data)
}

function getMustacheTokensInString(inputString) {
  return inputString.match(/{{\s*[\w.[\]\s]+\s*}}/g)
}

function addDataSourceToQuery(queryBuilder, aliases, dataConstraints, resultId, reportId) {
  // TODO generalize to other aliases and make joined tables and field names unique
  // similar to auth/constraints
  const { message, notification } = aliases

  if (message != null) {
    queryBuilder
      .leftJoin('Person as p', `${message}.personId`, 'p.id')
      .leftJoin('Site as s', `${message}.siteId`, 's.id')
      .leftJoin('Geography as g', `s.geographyId`, 'g.id')
      .leftJoin('Country as c', `g.countryId`, 'c.id')
      .leftJoin('State as st', `g.stateId`, 'st.id')
      .leftJoin('Lga as lg', `g.lgaId`, 'lg.id')
      .leftJoin('Device as d', `${message}.deviceId`, 'd.id')
      .leftJoin('DeviceType as dt', `d.deviceTypeId`, 'dt.id')
      .leftJoin('Result as r', `${message}.resultId`, 'r.id')
      .leftJoin('Geography as rg', `s.geographyId`, 'rg.id')
      .leftJoin('Country as rc', `rg.countryId`, 'rc.id')
      .leftJoin('Site as rs', 'r.reportableSiteId', 'rs.id')
      .leftJoin('Assay as a', assayJoin => {
        if (resultId) {
          assayJoin.on('r.assayId', 'a.id')
        } else {
          assayJoin.on('dt.id', 'a.deviceTypeId')
        }
      })
      .leftJoin('Sample as sample', `r.sampleId`, 'sample.id')
      .leftJoin('ResultCategory as rc1', `r.resultCategory1`, 'rc1.id')
      .leftJoin('ResultCategory as rc2', `r.resultCategory2`, 'rc2.id')
      .leftJoin('Partner as pu', 'pu.id', 'p.lastPartnerId')
      .leftJoin('Partner as pr', 'pr.id', 'r.partnerId')
      .leftJoin('TimeZone as devicetz', 'd.timezone', 'devicetz.id')
      .leftJoin('TimeZone as sitetz', 's.timezoneId', 'sitetz.id')
      .leftJoin('TimeZone as countrytz', 'rc.timezone', 'countrytz.id')
      .select(
        's.id as siteId',
        's.guid as siteGuid',
        's.externalId as siteExternalId',
        's.name as siteName',
        's.shortName as siteShortName',
        's.street1 as siteStreet1',
        's.street2 as siteStreet2',
        's.city as siteCity',
        's.zip as siteZip',
        's.guid as siteGuid',
        's.institutionGuid as siteInstitutionGuid',
        's.institutionName as siteInstitutionName',
        'st.name as siteState',
        'lg.name as siteLga',
        'p.name as personName',
        'p.cell as personCell',
        'p.cellE164 as personCellE164',
        'g.id as geographyId',
        'pu.plugin as partnerPlugin',
        'c.name as countryName',
        knex.raw('coalesce(c.countryCode,rc.countryCode) as countryCode'),
        knex.raw('coalesce(c.abbreviation,rc.abbreviation) as countryAbbreviation'),
        'd.id as deviceId',
        'd.name as deviceName',
        'd.isDaisyChained as daisyChained',
        'd.instrumentModel',
        'd.softwareType',
        knex.raw('d.ConfigurationData ->> "$.lisConfigOk" AS lisConfiguredCorrectly'),
        knex.raw('d.ConfigurationData ->> "$.computerOsVersion" AS computerOsVersion'),
        'd.lastPingOn as deviceLastPingOn',
        'd.lastSeenOn as deviceLastSeenOn',
        'd.serial as deviceSerial',
        'd.lastInstrumentSerial as lastInstrumentSerial',
        'd.stickerInstrumentSerial as deviceStickerInstrumentSerial',
        'dt.externalId as deviceTypeExternalId',
        'r.resultData',
        'r.id',
        'r.updatedOn',
        'r.patientData as resultPatientData',
        'r.formData as resultFormData',
        'r.startedOn as resultStartedOn',
        'r.endedOn as resultEndedOn',
        'r.notes as resultNotes',
        'r.consumableSerial',
        'r.consumableLot',
        'r.createdOn',
        'r.senderOperator',
        knex.raw('coalesce(r.moduleName, r.moduleSerial) as resultModuleName'),
        'r.instrumentSerial as resultInstrumentSerial',
        'r.moduleSerial as resultModuleSerial',
        'r.errorCode as resultErrorCode',
        'r.senderVersion as resultSoftwareVersion',
        'r.errorNotes as resultErrorNotes',
        'a.externalId as assayExternalId',
        'a.name as assayName',
        knex.raw("CASE WHEN IFNULL(d.gx10cModulesCount, 0) > 0 THEN '10-Color' ELSE '6-Color' END AS moduleColor"),
        'sample.externalId as sampleExternalId',
        'sample.collectedOn as sampleCollectedOn',
        'rc1.externalId as resultCategory1ExternalId',
        knex.raw(
          "case when rc1.externalId in ('Error', 'Invalid', 'NoResult') then rc1.externalid else 'Success' end as resultOutcome"
        ),
        'rc2.externalId as resultCategory2ExternalId',
        'rs.name as reportableSiteName',
        knex.raw('COALESCE(devicetz.timezone, sitetz.timezone, countrytz.timezone) as timezone')
      )
  }

  if (notification != null) {
    queryBuilder
      .leftJoin('Issue as i', `${notification}.issueId`, 'i.id')
      .leftJoin('IssueType as it', `i.issueTypeId`, 'it.id')
      .leftJoin('NotificationType as nt', `${notification}.notificationTypeId`, 'nt.id')
      .select(
        'i.createdOn as issueCreatedOn',
        'i.dueOn as issueDueOn',
        'i.data as issueData',
        'it.externalId as issueTypeExternalId',
        'nt.name as notificationTypeName',
        knex.raw("nt.filterCondition ->> '$.reportDateRange' as reportDateRange"),
        knex.raw("nt.filterCondition ->> '$.reportStartingWeekDay' as reportStartingWeekDay"),
        knex.raw(`${notification}.reportToken as reportToken`)
      )
  }

  if (!_.isEmpty(dataConstraints)) {
    let aliases = {
      assay: 'a',
      partner: 'pr',
      deviceType: 'dt',
      person: 'p',
      /*
      result: 'r',
      ^^^ Leaving this commented out to highlight the fact that adding these
          constraints will break the RO notifications configured for Myanmar
      */
      sample: 'sample',
    }

    if (!reportId) {
      aliases = {
        ...aliases,
        device: 'd',
        site: 's',
      }
    }

    queryBuilder.modify(addConstraints, dataConstraints, aliases, {
      showUnapprovedDevices: true,
      showDecommissionedDevices: true,
    })
  }

  return queryBuilder
}

/**
 * Processes mustache style templates using a result object for notifications, alerts and other result based string templates
 * @param  {object} data: the result record with the following known properties (all of which, can be undefined)
 *  {
 *    partnerPlugin: string
 *    siteExternalId: string
 *    siteName: string
 *    countryName: string
 *    countryCode: int
 *    siteShortName: string
 *    siteStreet1: string
 *    siteStreet2: string
 *    siteCity: string
 *    siteZip: string
 *    siteState: string
 *    siteLga: string
 *    deviceName: string
 *    deviceTypeExternalId: string
 *    deviceLastSeenOn: date/time
 *    deviceLastPingOn: date/time
 *    resultData: string (acceptable values are undefined, null, '' or JSON parsable)
 *    resultRawData: string
 *    resultFormData: string (acceptable values are undefined, null, '' or JSON parsable)
 *    resultPatientData: string (acceptable values are undefined, null, '' or JSON parsable)
 *    resultStartedOn: date/time
 *    resultEndedOn: date/time
 *    resultNotes: string
 *    consumableSerial: string
 *    consumableLot: string
 *    createdOn: date/time
 *    senderOperator: string
 *    resultModuleName: string
 *    resultModuleSerial: string
 *    resultErrorCode: string
 *    resultErrorNotes: string
 *    assayExternalId: string
 *    assayName: string
 *    sampleExternalId: string
 *    sampleData: string (acceptable values are undefined, null, '' or JSON parsable)
 *    sampleOriginSiteExternalId: string
 *    sampleCollectedOn: date/time
 *    resultCategory1ExternalId: string
 *    resultCategory2ExternalId: string
 *    personName: string
 *    personCell: string
 *    issueCreatedOn: date/time
 *    issueDueOn: date/time
 *    issueData: string (acceptable values are undefined, null, '' or JSON parsable)
 *    notificationTypeName: string
 *  }
 *   The object may also contain unknown properties
 *   The object must also contain the template strings that will be processed:
 * @param  {Array} templateFields: the keys in the data object that contain the string templates to be processed
 *   EG: [ 'emailSubjectTemplate', 'emailBodyTemplate' ]
 * @param  {Object} auth: auth object just in case of report based notifications that needs partnerData and therefore constraints
 * @return an object containing the processed string templates as specified in templateFields
 *   EG: { emailSubject: 'The processed subject string', emailBody: 'The processed body string' }
 */
async function processUsingDataSourceQuery(data, templateFields, auth) {
  const ds = await getBaseDataSource(data, auth)

  return templateFields.reduce((memo, field) => {
    const fieldName = field.replace(/template/i, '')
    const template = (data && data[field]) || ''
    memo[fieldName] = processUsingDynamicHelpers(template, ds)
    return memo
  }, {})
}

/**
 * Formats a result record into a nested JSON object, with a known schema, so that string templates can be based of of it
 * @param  {object} data the result record with the following properties:
 *  {
 *    partnerPlugin: string
 *    countryName: string
 *    countryCode: int
 *    siteExternalId: string
 *    siteName: string
 *    siteShortName: string
 *    siteStreet1: string
 *    siteStreet2: string
 *    siteCity: string
 *    siteZip: string
 *    siteState: string
 *    siteLga: string
 *    deviceName: string
 *    deviceTypeExternalId: string
 *    deviceLastSeenOn: date/time
 *    deviceLastPingOn: date/time
 *    resultData: string (acceptable values are undefined, null, '' or JSON parsable)
 *    resultRawData: string
 *    resultFormData: string (acceptable values are undefined, null, '' or JSON parsable)
 *    resultPatientData: string (acceptable values are undefined, null, '' or JSON parsable)
 *    resultStartedOn: date/time
 *    resultEndedOn: date/time
 *    resultNotes: string
 *    consumableSerial: string
 *    consumableLot: string
 *    createdOn: date/time
 *    senderOperator: string
 *    resultModuleName: string
 *    resultModuleSerial: string
 *    resultErrorCode: string
 *    resultErrorNotes: string
 *    assayExternalId: string
 *    sampleExternalId: string
 *    sampleData: string (acceptable values are undefined, null, '' or JSON parsable)
 *    sampleOriginSiteExternalId: string
 *    sampleCollectedOn: date/time
 *    resultCategory1ExternalId: string
 *    resultCategory2ExternalId: string
 *    personName: string
 *    personCell: string
 *    issueCreatedOn: date/time
 *    issueDueOn: date/time
 *    issueData: string (acceptable values are undefined, null, '' or JSON parsable)
 *    notificationTypeName: string
 *  }
 * @return a nested JSON object containing the data from the result record
 *  {
      country: {
        name: countryName,
        dialingCode: countryCode,
      },
      site: {
        id: siteExternalId,
        name: siteName,
        shortName: siteShortName,
        street1: siteStreet1,
        street2: siteStreet2,
        city: siteCity,
        zip: siteZip,
        state: siteState,
        lga: siteLga,
      },
      device: {
        name: deviceName,
        deviceType: deviceTypeExternalId,
        lastSeenOn: deviceLastSeenOn,
        lastPingOn: deviceLastPingOn,
      },
      result: {
        data: resultData ? JSON.parse(resultData) : {},
        rawData: resultRawData,
        formData: resultFormData ? JSON.parse(resultFormData) : {},
        patient: resultPatientData ? JSON.parse(resultPatientData) : {},
        startedOn: resultStartedOn,
        endedOn: resultEndedOn,
        notes: resultNotes,
        consumableSerial: consumableSerial,
        consumableLot: consumableLot,
        createdOn: createdOn,
        senderOperator: senderOperator,
        moduleName: resultModuleName,
        moduleSerial: resultModuleSerial,
        errorCode: resultErrorCode,
        errorNotes: resultErrorNotes,
        assay: {
          id: assayExternalId,
        },
        sample: {
          id: sampleExternalId,
          data: sampleData ? JSON.parse(sampleData) : {},
          originSite: {
            id: sampleOriginSiteExternalId,
          },
          collectedOn: sampleCollectedOn,
        },
        category1: {
          id: resultCategory1ExternalId,
        },
        category2: {
          id: resultCategory2ExternalId,
        },
      },
      person: {
        name: personName,
        cell: personCell,
      },
      issue: {
        createdOn: issueCreatedOn,
        dueOn: issueDueOn,
        data: issueData ? JSON.parse(issueData) : {},
      },
      notification: {
        type: notificationTypeName,
      },
      displayPreferences: { <the displayPreferences in the partner's plugin configuration EG: api\src\plugin\partner\Myanmar\settings.js> }
    }
 */
async function getBaseDataSource(data, auth) {
  const d = data || {}
  const { loadPlugin } = require('../plugin/loadPlugin')
  const { displayPreferences = {} } = await loadPlugin(d.partnerPlugin, undefined, 'settings')
  const resultData = d.resultData ? JSON.parse(d.resultData) : {}
  const issueData = d.issueData ? JSON.parse(d.issueData) : {}
  const isHardwareIssue = d.issueTypeExternalId ? d.issueTypeExternalId.indexOf('Hardware') === 0 : false
  const { apiUrl = '' } = auth?.credentials ? (await getCurrentPartner(auth)) || {} : {}
  let dateRange = null
  if (d?.reportDateRange) {
    const { minDate, maxDate } = getDateRangeFilters(new Date(), d.reportDateRange, d.reportStartingWeekDay)
    dateRange = `${format(parseISO(minDate), 'yyyy-MM-dd')} - ${format(parseISO(maxDate), 'yyyy-MM-dd')}`
  }

  return {
    country: {
      name: d.countryName,
      dialingCode: d.countryCode,
    },
    site: {
      id: d.siteExternalId,
      name: d.siteName,
      shortName: d.siteShortName,
      siteGuid: d.siteGuid,
      street1: d.siteStreet1,
      street2: d.siteStreet2,
      city: d.siteCity,
      zip: d.siteZip,
      state: d.siteState,
      lga: d.siteLga,
      primaryContact:
        d.siteContacts && d.siteContacts.length > 0
          ? {
              name: d.siteContacts[0].name,
              title: d.siteContacts[0].title,
              phone: d.siteContacts[0].phone,
              cell: d.siteContacts[0].cell,
              email: d.siteContacts[0].email,
            }
          : {},
      completionRatePercentage: issueData.completionRatePercentage,
      guid: d.siteGuid,
      institutionGuid: d.siteInstitutionGuid,
      institutionName: d.siteInstitutionName,
    },
    device: {
      name: d.deviceName,
      deviceType: d.deviceTypeExternalId,
      lastSeenOn: d.deviceLastSeenOn,
      lastPingOn: d.deviceLastPingOn,
      serial: d.deviceSerial,
      lastInstrumentSerial: d.lastInstrumentSerial,
      calibrationDueDate: issueData.calibrationDueDate,
      daisyChained: d.daisyChained,
      instrumentModel: d.instrumentModel,
      softwareType: d.softwareType,
      lisConfiguredCorrectly: d.lisConfiguredCorrectly,
      computerOsVersion: d.computerOsVersion,
      moduleColor: d.moduleColor,
      stickerInstrumentSerial: d.deviceStickerInstrumentSerial,
      expectedBackOnlineDate: issueData.maintenanceDueOn,
    },
    result: {
      id: d.id,
      data: resultData,
      resultData,
      formData: d.resultFormData ? JSON.parse(d.resultFormData) : {},
      patient: d.resultPatientData ? JSON.parse(d.resultPatientData) : {},
      patientData: d.resultPatientData ? JSON.parse(d.resultPatientData) : {},
      rawData: d.resultRawData,
      startedOn: d.resultStartedOn,
      updatedOn: d.updatedOn,
      endedOn: d.resultEndedOn,
      notes: d.resultNotes,
      consumableLot: d.consumableLot,
      consumableSerial: d.consumableSerial,
      createdOn: d.createdOn,
      senderOperator: d.senderOperator,
      moduleName: d.resultModuleName,
      moduleSerial: d.resultModuleSerial,
      instrumentSerial: d.resultInstrumentSerial,
      softwareVersion: d.resultSoftwareVersion,
      errorCode: d.resultErrorCode,
      errorNotes: d.resultErrorNotes,
      resultOutcome: d.resultOutcome,
      assay: {
        id: d.assayExternalId,
        name: d.assayName,
      },
      sample: {
        id: d.sampleExternalId,
        data: d.sampleData ? JSON.parse(d.sampleData) : {},
        originSite: {
          id: d.sampleOriginSiteExternalId,
        },
        collectedOn: d.sampleCollectedOn,
        // TODO: Add data JSON field to Sample table to include Assay specific sample details duch as type, appearance, volume, repeat collection
        // TODO: Add Sample Origin Site External ID, Collection Date and Data To Base Query, The ITIS Webhook Notification Needs This
      },
      category1: {
        id: d.resultCategory1ExternalId,
      },
      category2: {
        id: d.resultCategory2ExternalId,
      },
      detected: {
        resistances: ['GxMtbRif', 'GxMtbRifUltra', 'GxMtbXdr'].includes(d.assayExternalId)
          ? getMtbDetectedResistances(d.assayExternalId, d.resultCategory2ExternalId, resultData)
          : '',
      },
      reportableSiteName: d.reportableSiteName,
    },
    person: {
      name: d.personName,
      cell: d.personCell,
    },
    issue: {
      createdOn: d.issueCreatedOn,
      dueOn: d.issueDueOn,
      data: issueData,
      occurrences: isHardwareIssue
        ? issueData.totalErrors // <-- 'totalErrors' is defined in analyzeDeviceHardwareError()
        : issueData.resultsWithErrors,
      errorCode: issueData.errorCodes,
    },
    log: {
      startedOn: isHardwareIssue ? issueData.startedOn : null,
    },
    notification: {
      type: d.notificationTypeName,
    },
    report: {
      downloadLink: `${apiUrl}/api/reports/download?token=${d.reportToken}`,
      dateRange,
    },
    displayPreferences,
    timezone: d.timezone,
    deviceOperation: {
      guid: d.deviceOperationGuid,
      startedOn: d.deviceOperationStartedOn,
      errors: d.deviceOperationErrors,
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
  /**
   * if template contains mustached string 'numberOfDays' then process it in few steps
   * - replace mustaches with some tokens, i.e. '${openMustaches}' and '${closeMustaches}'
   *   Such odd tokens - '${...}' - to make sure template never has such strings
   * - replace captured value of 'numberOfDays' section with handlebar function {{isoDate ...}}
   * - process template - this replaces {{isoDate ...}} and all other placeholders with actual values
   * - then replace tokens '${openMustaches}' and '${closeMustaches}' with corresponding mustaches
   * - process template - this replaces {{numberOfDays ...}} with actual value
   *
   * If template contains one of the following mustached string
   * - device.lastSeenOn
   * - device.lastPingOn
   * - result.startedOn
   * - result.endedOn
   * - result.createdOn
   * - result.sample.collectedOn
   * then process it changing the format to localizedDateTime (Wed Aug 24 2022 02:25:32 GMT-4)
   *
   * If template contains
   * - device.calibrationDueDate
   * then process it changing the format to localizedDate (Wed Aug 24 2022)
   *
   * If template contains
   * - device.daysToCalibrationDueDate
   * then process calculate the difference between today and the calibration due date in number of days.
   *
   * otherwise - process template in one step
   */

  const dynamicTemplate = template
    .replace(
      /{{\s*numberOfDays\s+([\w.[\]\s]+)\s*}}/g,
      (str, match) => `\${openMustaches}numberOfDays "{{isoDate ${match}}}"\${closeMustaches}`
    )
    .replace(
      /{{\s*(device.lastSeenOn|device.lastPingOn|result.startedOn|result.endedOn|result.createdOn|result.sample.collectedOn)\s*}}/g,
      (str, match) => `\${openMustaches}localizedDateTime ${match} timezone\${closeMustaches}`
    )
    // eslint-disable-next-line no-unused-vars
    .replace(/{{\s*(device.calibrationDueDate|device.expectedBackOnlineDate)\s*}}/g, (_str, match) => {
      return `\${openMustaches}localizedDate ${match} timezone\${closeMustaches}`
    })
    // eslint-disable-next-line no-unused-vars
    .replace(/{{\s*(device.daysToCalibrationDueDate)\s*}}/g, (_str, _match) => {
      return `\${openMustaches}daysBeforeToday device.calibrationDueDate \${closeMustaches}`
    })
    .replace(/\{{2,3}\s*(report.downloadLink)\s*\}{2,3}/g, '{{{report.downloadLink}}}')
    .replace(/{{[^}]+customFields\.([^}]*)}}/g, `{{ defaultTo result.$1 'N/A' }}`)

  let message = processUsingHandlebarsSyntax(dynamicTemplate, ds)

  if (dynamicTemplate !== template) {
    message = processUsingHandlebarsSyntax(
      message.replace(/\${openMustaches}/g, '{{').replace(/\${closeMustaches}/g, '}}'),
      ds
    )
  }

  return message
}

function curlyBrace(object, open) {
  return open ? '{' : '}'
}

function squareBrace(object, open) {
  return open ? '[' : ']'
}

function numberOfDays(date) {
  if (date == null || date === '') {
    return 'days'
  }

  const parsedDate = date instanceof Date ? date : parseISO(date)
  return formatDistanceStrict(new Date(), parsedDate, {
    unit: 'day',
    roundingMethod: 'floor',
  })
}

function isoDate(date) {
  const parsed = parseDateOrDefault(date)
  return parsed == null ? null : parsed.toISOString()
}

function localizedDateTime(date, timezone) {
  return date && getFormattedDateTimeWithTimezone(date, timezone)
}

function localizedDate(date, timezone) {
  return date && getFormattedDate(date, timezone)
}

function daysFromToday(date) {
  const a = daysBetweenDates(new Date(), new Date(date))
  return a
}

function getArgumentFromOptions(options, keyInOptionsHash) {
  if (['string', 'number', 'undefined', 'null', 'boolean', 'symbol'].includes(typeof options)) {
    return options
  }
  return _.get(options, ['hash', keyInOptionsHash])
}

function formatDate(date, options) {
  if (_.isNil(date)) {
    return date
  }
  const dateFormat =
    getArgumentFromOptions(options, 'formatString') || _.get(this, 'displayPreferences.dateFormat', 'yyyy-MM-dd')
  return formatDateOrDefault(date, dateFormat)
}

function formatPhone(phoneNumber, options) {
  if (_.isNil(phoneNumber) || !phoneNumber.replace(/\s/, '')) {
    return ''
  }
  const countryDialingCode = `${getArgumentFromOptions(options, 'dialingCode') || ''}`.replace(/[\s-\\+]/, '')
  let sanitizedPhoneNumber = phoneNumber.replace(/[\s-]/, '')
  if (countryDialingCode) {
    if (sanitizedPhoneNumber.indexOf(countryDialingCode) === 0) {
      sanitizedPhoneNumber = sanitizedPhoneNumber.substr(countryDialingCode.length)
    } else if (sanitizedPhoneNumber.indexOf(`0${countryDialingCode}`) === 0) {
      sanitizedPhoneNumber = sanitizedPhoneNumber.substr(countryDialingCode.length + 1)
    } else if (sanitizedPhoneNumber.indexOf(`00${countryDialingCode}`) === 0) {
      sanitizedPhoneNumber = sanitizedPhoneNumber.substr(countryDialingCode.length + 2)
    }
    if (sanitizedPhoneNumber.indexOf('0') === 0) {
      sanitizedPhoneNumber = sanitizedPhoneNumber.substr(1)
    }
    if (sanitizedPhoneNumber.indexOf('+') !== 0) {
      sanitizedPhoneNumber = `+${countryDialingCode}${sanitizedPhoneNumber}`
    }
  }
  return sanitizedPhoneNumber
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
  if (_.isNil(value) || value instanceof handlebars.SafeString || typeof value !== 'string') {
    return value
  }
  return new handlebars.SafeString(value)
}

function rawValue(value) {
  let raw = value
  if (value instanceof handlebars.SafeString) {
    raw = value.string
  }
  return raw
}

function mapValue(value, options) {
  const raw = rawValue(value)
  const valueMapString = getArgumentFromOptions(options, 'valueMap')
  if (valueMapString) {
    return safeString(JSON.parse(valueMapString)[raw])
  }
  return safeString(value)
}

function defaultTo(value, options) {
  const raw = rawValue(value)
  const defaultValue = getArgumentFromOptions(options, 'value')
  return safeString(raw || defaultValue)
}

function enclose(value, options) {
  const raw = rawValue(value)
  if (_.isNil(raw)) {
    return value
  }
  const encloseWith = getArgumentFromOptions(options, 'with')
  return safeString(`${encloseWith}${raw}${encloseWith}`)
}

function escapeLines(value) {
  const raw = rawValue(value)
  if (!raw || raw.indexOf('\n') < 0) {
    return safeString(value)
  }
  return safeString(_.map(raw.split('\n'), line => line.trim()).join('\\n'))
}

function urlEncode(value) {
  const raw = rawValue(value)
  if (_.isNil(raw)) {
    return value
  }
  return safeString(encodeURIComponent(raw))
}

function priorityResult(resultCategories, resultCategoryId) {
  if (resultCategories.includes(resultCategoryId)) {
    return resultCategoryId
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
    const foundPriorityCategory = priorityResult(resultCategories, orderedPriorityCategories[i])
    if (foundPriorityCategory) {
      return foundPriorityCategory
    }
  }
  return resultCategory1 || resultCategory2
}

function isRegexMatch(stringValue, options) {
  const raw = rawValue(stringValue)
  if (!_.isNil(raw)) {
    const expression = getArgumentFromOptions(options, 'expression')
    if (expression) {
      const regex = new RegExp(expression, 'g')
      return !_.isNull(raw.match(regex))
    }
  }
}

function extractValueFromRegexCaptureGroup(stringValue, options) {
  const raw = rawValue(stringValue)
  if (!_.isNil(raw)) {
    const expression = getArgumentFromOptions(options, 'expression')
    const groupNumber = _.get(options, ['hash', 'groupNumber'], 1)
    if (expression) {
      const regex = new RegExp(expression, 'gmi')
      const match = regex.exec(stringValue)
      if (match && match.length > groupNumber) {
        return safeString(match[groupNumber])
      }
    }
  }
}

function toInt(value) {
  const raw = rawValue(value)
  if (!_.isNil(raw)) {
    return parseInt(raw, 10)
  }
}

function extractNumericViralLoadValue(value) {
  let raw = value
  if (_.isNil(raw)) {
    raw = 0
  } else {
    raw = rawValue(value)
  }
  if (typeof raw === 'number') {
    return { numericValue: raw, text: raw.toString() }
  }
  if (typeof raw === 'string') {
    const numericStringValue = (rawValue(extractValueFromRegexCaptureGroup(raw, '([\\d|\\s|\\.]+)')) || '').trim()
    const numericStringValueWithoutWhiteSpace = numericStringValue.replace(/\s/, '')
    const numericValue = parseFloat(numericStringValueWithoutWhiteSpace)
    if (!Number.isNaN(numericValue)) {
      if (isRegexMatch(raw, '>[\\d|\\s|\\.]+')) {
        return {
          numericValue: numericValue + 1,
          text: `> ${numericStringValue}`,
        }
      }
      if (isRegexMatch(raw, '<[\\d|\\s|\\.]+')) {
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

function offsetToTimeZone(date, options) {
  if (_.isNil(date)) {
    return date
  }
  const parsedDate = parseDateOrDefault(date)
  if (_.isNil(parsedDate)) {
    return parsedDate
  }
  const timeZoneName = getArgumentFromOptions(options, 'timeZone')
  if (!timeZoneName) {
    return parsedDate
  }
  const timeZone = findTimeZone(timeZoneName)
  return convertToTimeZone(parsedDate, { timeZone: timeZone.name })
}

function customFieldValueFromLabel(customFieldData, label) {
  if (!_.isEmpty(customFieldData)) {
    return _.get(_.find(Object.values(customFieldData), { label }), ['value'])
  }
}

function coalesce(...rest) {
  // Using dropRight here to ignore the last argument
  //  passed to this call. Handlebars passes the helper
  //  object, with it's options, as the last arg
  return _.dropRight(rest).find(arg => !!arg)
}

function getMtbDetectedResistances(assayExternalId, resultCategory2ExternalId, resultData) {
  if (['GxMtbRif', 'GxMtbRifUltra'].includes(assayExternalId)) {
    return resultCategory2ExternalId === 'Detected' ? 'RIF' : ''
  }

  if (assayExternalId === 'GxMtbXdr') {
    const xdrResistances = resultData.allResistances || {}
    return Object.keys(xdrResistances)
      .filter(key => xdrResistances[key] === 'Detected')
      .join(', ')
  }

  return ''
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
