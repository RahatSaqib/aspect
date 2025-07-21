const Promise = require('bluebird')
const _ = require('lodash')
const { knex } = require('../db')

const tableCache = {}

// TODO ASP-757 Standardize static data key on externalId
const cacheConfig = {
  Assay: {},
  AssayType: {
    keyColumn: 'name',
  },
  AsyncReportStatus: {},
  Consumable: {
    keyColumn: 'externalId',
    additionalColumns: ['includeLocation'],
  },
  ConsumableReason: {
    keyColumn: 'externalId',
    additionalColumns: ['effectOnStock'],
  },
  DeviceApiRawStatus: {},
  DeviceApproval: {
    keyColumn: 'token',
  },
  DeviceMaintenanceStatus: {},
  DeviceMaintenanceType: {
    keyColumn: 'externalId',
  },
  DeviceType: {
    additionalColumns: ['plugin'],
  },
  DeviceTypeCategory: {
    keyColumn: 'name',
  },
  Disease: {},
  Feature: {
    keyColumn: 'module',
  },
  FileContentType: {},
  FormType: {},
  IssueCategory: {},
  IssueEventStatus: {},
  IssueStatus: {},
  IssueStatusSeverity: {},
  IssueType: {},
  JobFunction: {},
  MessageSeverity: {},
  MessageStatus: {},
  NotificationTypeCategory: {},
  PartnerType: {},
  ResultCategory: {},
  ResultSource: {},
  ResultStatus: {},
  ResultTreatmentStatus: {},
  ResultType: {},
  ResultWorkflowStatus: {},
  Report: {},
  SampleType: {},
  SiteType: {},
  TimeZone: {
    keyColumn: 'timeZone',
  },
  Unit: {
    keyColumn: 'name',
  },
}

async function rowsByColumn(table) {
  const cache = tableCache[table]
  if (cache) {
    return cache
  }

  const { keyColumn = 'externalId', additionalColumns = [] } = cacheConfig[table]

  // this gives us { [key1]: {[col1]: row1[col1], [col2]: row2[col2]...
  const columns = ['id', ...additionalColumns]
  const rows = await knex(table).select(keyColumn, ...columns)

  const rowsAsObject = rows.reduce((memo, row) => {
    const key = row[keyColumn]
    memo[key] = row
    return memo
  }, {})

  // we want { [col1]: { [key1]: row1[col1], [key2]: row2[col1]...
  const cacheEntryByColumns = columns.reduce((memo, column) => {
    memo[column] = _.mapValues(rowsAsObject, column)
    return memo
  }, {})

  const cacheEntryById = rows.reduce((memo, row) => {
    memo[row.id] = row
    return memo
  }, {})

  tableCache[table] = { ...cacheEntryByColumns, objectById: cacheEntryById }
  return tableCache[table]
}

async function lookupKeyByColumn(table, column) {
  const cache = await rowsByColumn(table)
  return cache[column]
}

function objectById(table) {
  return async id => {
    const cache = await rowsByColumn(table)
    return cache == null ? null : cache.objectById[id]
  }
}

function keyToObject(table, column) {
  return async () => lookupKeyByColumn(table, column)
}

function keyToValue(table, column) {
  return async key => {
    const cache = await lookupKeyByColumn(table, column)
    return cache == null ? null : cache[key]
  }
}

_.each(cacheConfig, (config, table) => {
  const { additionalColumns = [] } = config
  // assayTypeToId, deviceApprovalToId, etc. for each configured table
  // deviceTypeToPlugin etc. for each configured additional column
  const name = _.lowerFirst(table)
  const columns = ['id', ...additionalColumns]

  const lookupById = `${name}ById`
  exports[lookupById] = objectById(table)

  _.each(columns, column => {
    const columnName = _.upperFirst(column)

    const lookupSingleItem = `${name}To${columnName}`
    exports[lookupSingleItem] = keyToValue(table, column)

    const lookupDictionary = `all${table}To${columnName}`
    exports[lookupDictionary] = keyToObject(table, column)
  })
})

exports.issueCategoryIntlToShortname = async function () {
  return knex('IssueCategory')
    .select('i18nKey', 'shortName')
    .then(items =>
      items.reduce((memo, { i18nKey, shortName }) => {
        memo[i18nKey] = shortName
        return memo
      }, {})
    )
}

/**
 * Builds dictionary of external ids, mapped to the record ID from the database
 * @param {string} table The table name
 * @returns The dictionary of keys
 */
exports.getIdsByExternalId = async table => {
  const mapping = {}
  await Promise.each(knex(table), item => {
    mapping[item.externalId] = item.id
  })
  return mapping
}

/**
 * Get specified dictionary by table and column names
 */
const getDictionary = async (table, column = 'id') => {
  const fn = keyToObject(table, column)
  const data = await fn()
  return data
}
exports.getDictionary = getDictionary

/**
 * return cached values for column from specified table
 */
const getDictionarySync = (table, column = 'id') => {
  const cache = tableCache[table]
  if (!cache) return null
  return cache[column]
}
exports.getDictionarySync = getDictionarySync

/**
 * Make sure to read and cache some dictionaries
 * to be able to get them in sync mode by `getDictionarySync`.
 * As an example - this is needed to use some dictionaries in plugins
 * which are called by functions within `addConstraints()`.
 * For more details see calling of plugin `modifyQueryToExcludeResult` (2023-04-13 Now deleted)
 * in `api/src/auth/constraints.js`
 *
 * Pls notice that below func should be called for each context. When server start processing
 * a request - do call this func in `server.js` in `onRequest` func.
 * And call it also in messageContext thread too - to make MQ thread also have dictionary
 * tables defined
 */
exports.initDictionaryTables = async () => {
  const dictionaryTables = [{ table: 'Assay', column: 'id' }]
  await Promise.all(
    dictionaryTables.map(async ({ table, column }) => {
      if (!getDictionarySync(table, column)) {
        // calling of async func `getDictionary` reads and caches specified table/column
        return getDictionary(table, column)
      }
    })
  )
}
