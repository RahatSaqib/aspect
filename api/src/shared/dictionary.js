const { knex } = require('../db')

const cacheKeyToId = {}

function keyToId(table, keyColumn = 'externalId') {
  return async key => {
    let cache = cacheKeyToId[table]
    if (cache == null) {
      cache = await knex(table)
        .select('id', keyColumn)
        .reduce((memo, row) => {
          memo[row[keyColumn]] = row.id
          return memo
        }, {})
      cacheKeyToId[table] = cache
    }
    return cache[key]
  }
}

module.exports = {
  // TODO cache AssayType externalId
  assayTypeToId: keyToId('AssayType', 'name'),
  // TODO cache ConsumableReason externalId
  consumableReasonToId: keyToId('ConsumableReason', 'name'),
  // TODO cache DeviceStatus externalId
  deviceStatusToId: keyToId('DeviceStatus', 'token'),
  deviceTypeToId: keyToId('DeviceType'),
  // TODO cache DeviceTypeCategory externalId
  deviceTypeCategoryToId: keyToId('DeviceTypeCategory', 'name'),
  fileContentTypeToId: keyToId('FileContentType'),
  featureToId: keyToId('Feature', 'module'),
  issueCategoryToId: keyToId('IssueCategory'),
  issueEventStatusToId: keyToId('IssueEventStatus'),
  issueStatusToId: keyToId('IssueStatus'),
  issueStatusSeverityToId: keyToId('IssueStatusSeverity'),
  issueTypeToId: keyToId('IssueType'),
  messageStatusToId: keyToId('MessageStatus'),
  messageSeverityToId: keyToId('MessageSeverity'),
  // TODO cache PartnerType externalId
  partnerTypeToId: keyToId('PartnerType', 'name'),
  resultCategoryToId: keyToId('ResultCategory'),
  resultSourceToId: keyToId('ResultSource'),
  resultTypeToId: keyToId('ResultType'),
  resultWorkflowStatusToId: keyToId('ResultWorkflowStatus'),
  sampleTypeToId: keyToId('SampleType'),
}
