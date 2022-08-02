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
  Consumable: {},
  ConsumableReason: {
    keyColumn: 'name',
  },
  DeviceApiRawStatus: {},
  DeviceApproval: {
    keyColumn: 'token',
  },
  DeviceMaintenanceStatus: {},
  DeviceMaintenanceType: {},
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
  PartnerType: {
    keyColumn: 'name',
  },
  ResultCategory: {},
  ResultSource: {},
  ResultStatus: {},
  ResultTreatmentStatus: {},
  ResultType: {},
  ResultWorkflowStatus: {},
  Report: {},
  SampleType: {},
  TimeZone: {
    keyColumn: 'timeZone',
  },
  Unit: {
    keyColumn: 'name',
  },
}

async function rowsByColumn(table) {
  let cache = tableCache[table]
  if (cache == null) {
    const { keyColumn = 'externalId', additionalColumns = [] } = cacheConfig[table]

    // this gives us { [key1]: {[col1]: row1[col1], [col2]: row2[col2]...
    const columns = ['id', ...additionalColumns]
    const rowsAsObject = await knex(table)
      .select(keyColumn, ...columns)
      .then(items =>
        items.reduce((memo, row) => {
          const key = row[keyColumn]
          memo[key] = row
          return memo
        }, {})
      )

    // we want { [col1]: { [key1]: row1[col1], [key2]: row2[col1]...
    cache = _.reduce(
      columns,
      (memo, column) => {
        memo[column] = _.mapValues(rowsAsObject, column)
        return memo
      },
      {}
    )

    tableCache[table] = cache
  }
  return cache
}

async function lookupKeyByColumn(table, column) {
  const cache = await rowsByColumn(table)
  return cache[column]
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
  _.each(columns, column => {
    const columnName = _.upperFirst(column)
    const lookupSingleItem = `${name}To${columnName}`
    const lookupDictionary = `all${table}To${columnName}`
    exports[lookupSingleItem] = keyToValue(table, column)
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
