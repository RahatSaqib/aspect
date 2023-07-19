const _ = require('lodash')
const { transformSampleStatus } = require('./transformSampleStatus')

function transformSampleData(data) {
  if (_.isNil(data)) return null
  if (data?.sampleData && typeof data?.sampleData === 'string') {
    data.sampleData = JSON.parse(data?.sampleData)
  }
  return {
    id: data?.sampleId,
    externalId: data?.sampleExternalId,
    originSite: {
      id: data?.sampleSiteId,
      name: data?.sampleSiteName,
      stateName: data?.sampleSiteStateName,
      externalId: data?.sampleSiteExternalId,
    },
    clinicianName: data?.sampleData?.clinicianName || null,
    sampleType: {
      name: data?.sampleTypeName,
      i18nKey: data?.sampleTypeI18nKey,
      externalId: data?.sampleTypeExternalId,
    },
    status: transformSampleStatus(data?.sampleStatus),
    collectedOn: data?.sampleCollectedOn,
    updatedOn: data?.sampleUpdatedOn,
  }
}

module.exports = { transformSampleData }
