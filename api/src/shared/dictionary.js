const _ = require('lodash')
const { knex } = require('../db')

const tableCache = {}

// TODO ASP-757 Standardize static data key on externalId
const cacheConfig = {
  AssayType: {
    keyColumn: 'name',
  },
  ConsumableReason: {
    keyColumn: 'name',
  },
  DeviceStatus: {
    keyColumn: 'token',
  },
  DeviceType: {
    additionalColumns: ['plugin'],
  },
  DeviceTypeCategory: {
    keyColumn: 'name',
  },
  FileContentType: {},
  Feature: {
    keyColumn: 'module',
  },
  IssueCategory: {},
  IssueEventStatus: {},
  IssueStatus: {},
  IssueStatusSeverity: {},
  IssueType: {},
  MessageStatus: {},
  MessageStatusSeverity: {},
  PartnerType: {
    keyColumn: 'name',
  },
  ResultCategory: {},
  ResultSource: {},
  ResultType: {},
  ResultWorkflowStatus: {},
  SampleType: {},
  Unit: {
    keyColumn: 'name',
  },
}

async function rowsAsObject(table) {
  let cache = tableCache[table]
  if (cache == null) {
    const { keyColumn = 'externalId', additionalColumns = [] } = cacheConfig[
      table
    ]
    cache = await knex(table)
      .select('id', keyColumn, ...additionalColumns)
      .reduce((memo, row) => {
        const key = row[keyColumn]
        memo[key] = row
        return memo
      }, {})
    tableCache[table] = cache
  }
  return cache
}

function keyToValue(table, column) {
  return async key => {
    const cache = await rowsAsObject(table)
    const row = cache[key]
    return row == null ? null : row[column]
  }
}

_.each(cacheConfig, (config, table) => {
  const { additionalColumns = [] } = config
  // assayTypeToId, deviceStatusToId, etc. for each configured table
  // deviceTypeToPlugin etc. for each configured additonal column
  const name = _.lowerFirst(table)
  const columns = ['id', ...additionalColumns]
  _.each(columns, column => {
    const columnName = _.upperFirst(column)
    const functionName = `${name}To${columnName}`
    exports[functionName] = keyToValue(table, column)
  })
})
