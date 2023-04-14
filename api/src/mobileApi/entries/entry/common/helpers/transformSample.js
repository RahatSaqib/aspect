function transformSampleData(data) {
  const output = {
    id: data.sampleId,
    externalId: data.sampleExternalId,
    originSite: { id: data.sampleOriginSiteId, name: data.sampleOriginSiteName },
    sampleType: data.sampleType,
    status: {
      color: null,
      i18nKey: null,
      title: null,
    },
    collectedOn: data.sampleCollectedOn,
  }

  return output
}

module.exports = { transformSampleData }
