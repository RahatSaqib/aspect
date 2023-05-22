const _ = require('lodash')
const { transformSampleStatus } = require('./transformSampleStatus')

function transformSampleData(data) {
  if (_.isNil(data)) return null
  const output = {
    id: data?.id,
    externalId: data?.sampleExternalId,
    originSite: { id: data?.sampleSiteId, name: data?.sampleSiteName, externalId: data?.sampleSiteExternalId },
    sampleType: {
      name: data?.sampleTypeName,
      i18nKey: data?.sampleTypeI18nKey,
      externalId: data?.sampleTypeExternalId,
    },
    status: transformSampleStatus(data?.sampleStatus),
    collectedOn: data?.sampleCollectedOn,
    updatedOn: data?.sampleUpdatedOn,
  }
  return output
}

module.exports = { transformSampleData }
