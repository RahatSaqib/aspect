const _ = require('lodash')
const { returnIso8601StringWithoutTimeZoneOffset } = require('../../../shared/date')

const assayAvatarColorsIcon = {
  tb: {
    backgroundColour: 'purple',
    foregroundColour: 'secondary',
    contentIcon: null,
  },
  hcv: {
    backgroundColour: 'secondary',
    foregroundColour: 'primary',
    contentIcon: null,
  },
  hiv: {
    backgroundColour: 'orange',
    foregroundColour: 'secondary',
    contentIcon: null,
  },
  ebola: {
    backgroundColour: 'secondary',
    foregroundColour: 'primary',
    contentIcon: null,
  },
  covid: {
    backgroundColour: 'purple',
    foregroundColour: 'secondary',
    contentIcon: null,
  },
  hbv: {
    backgroundColour: 'secondary',
    foregroundColour: 'primary',
    contentIcon: null,
  },
  default: {
    backgroundColour: 'orange',
    foregroundColour: 'secondary',
    contentIcon: null,
  },
}

// transformed data
const getTransformedData = (data, setDelivered, followUps, comments) =>
  _.map(data, d => ({
    id: d.id,
    externalId: d.externalId,
    endedOn: returnIso8601StringWithoutTimeZoneOffset(d.endedOn),
    updatedOn: d.updatedOn,
    assayExternalId: d.assayExternalId,
    siteName: d.siteName,
    sampleOriginSiteId: d.sampleOriginSiteId,
    firstViewedOn: d.firstViewedOn ? d.firstViewedOn : null,
    deviceName: d.deviceName,
    resultCategory1ExternalId: d.resultCategory1ExternalId,
    resultCategory2ExternalId: d.resultCategory2ExternalId,
    patientData: d.patientData ? JSON.parse(d.patientData) : null,
    resultData: d.resultData
      ? _.pick(JSON.parse(d.resultData), ['resultText', 'copies', 'log', 'detectedResistance'])
      : null,
    sample: {
      id: d.sampleId,
      originSite: d.sampleOriginSiteId
        ? {
            externalId: d.sampleOriginSiteExternalId,
            name: d.sampleOriginSiteName,
          }
        : null,
    },
    workflowStatus: {
      name: setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered' ? 'Delivered' : d.resultWorkflowStatusName,
      externalId:
        setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered'
          ? 'Delivered'
          : d.resultWorkflowStatusExternalId,
      i18nKey:
        setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered'
          ? 'ResultWorkflowStatusDelivered'
          : d.resultWorkflowStatusi18nKey,
      reason:
        setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered'
          ? 'Download Results Api'
          : d.resultWorkflowStatusReason,
      changedOn:
        setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered' ? new Date() : d.resultWorkflowStatusChangedOn,
      setDelivered: setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered',
    },
    treatmentStatus: {
      changedOn: d.resultTreatmentStatusChangedOn,
      name: d.resultTreatmentStatusName,
      externalId: d.resultTreatmentStatusExternalId,
      i18nKey: d.resultTreatmentStatusi18nKey,
    },
    followUps: _.sortBy(
      _.filter(followUps, { resultId: d.id }).map(f => _.omit(f, 'resultId')),
      ['date', 'updatedOn']
    ),
    comments: _.orderBy(
      _.filter(comments, { resultId: d.id }).map(f => _.omit(f, 'resultId')),
      ['createdOn'],
      ['desc']
    ),
    // result transferred
    reportableSiteName: d.reportableSiteName,
    transferredOn: d.transferredOn,
    transferredBy: d.transferredBy,
    reportableSiteId: d.reportableSiteId,
    diseaseExternalId: d.diseaseExternalId,
    diseaseName: d.diseaseName,
  }))

// Trasnformed data v2
const getTransformedDataV2 = (data, setDelivered, followUps, comments) =>
  _.map(data, d => {
    const assayAvatar = assayAvatarColorsIcon[d.diseaseExternalId]
      ? assayAvatarColorsIcon[d.diseaseExternalId]
      : assayAvatarColorsIcon.default
    return {
      id: d.id,
      externalId: d.externalId,
      endedOn: returnIso8601StringWithoutTimeZoneOffset(d.endedOn),
      updatedOn: d.updatedOn,
      assayExternalId: d.assayExternalId,
      siteName: d.siteName,
      sampleOriginSiteId: d.sampleOriginSiteId,
      firstViewedOn: d.firstViewedOn ? d.firstViewedOn : null,
      deviceName: d.deviceName,
      resultCategory1ExternalId: d.resultCategory1ExternalId,
      resultCategory2ExternalId: d.resultCategory2ExternalId,
      patientData: d.patientData ? JSON.parse(d.patientData) : null,
      resultData: d.resultData
        ? _.pick(JSON.parse(d.resultData), ['resultText', 'copies', 'log', 'detectedResistance'])
        : null,
      sample: {
        id: d.sampleId,
        originSite: d.sampleOriginSiteId
          ? {
              externalId: d.sampleOriginSiteExternalId,
              name: d.sampleOriginSiteName,
            }
          : null,
      },
      workflowStatus: {
        name:
          setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered' ? 'Delivered' : d.resultWorkflowStatusName,
        externalId:
          setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered'
            ? 'Delivered'
            : d.resultWorkflowStatusExternalId,
        i18nKey:
          setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered'
            ? 'ResultWorkflowStatusDelivered'
            : d.resultWorkflowStatusi18nKey,
        reason:
          setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered'
            ? 'Download Results Api'
            : d.resultWorkflowStatusReason,
        changedOn:
          setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered'
            ? new Date()
            : d.resultWorkflowStatusChangedOn,
        setDelivered: setDelivered && d.resultWorkflowStatusExternalId !== 'Delivered',
      },
      treatmentStatus: {
        changedOn: d.resultTreatmentStatusChangedOn,
        name: d.resultTreatmentStatusName,
        externalId: d.resultTreatmentStatusExternalId,
        i18nKey: d.resultTreatmentStatusi18nKey,
      },
      followUps: _.sortBy(
        _.filter(followUps, { resultId: d.id }).map(f => _.omit(f, 'resultId')),
        ['date', 'updatedOn']
      ),
      comments: _.orderBy(
        _.filter(comments, { resultId: d.id }).map(f => _.omit(f, 'resultId')),
        ['createdOn'],
        ['desc']
      ),
      // result transferred
      reportableSiteName: d.reportableSiteName,
      transferredOn: d.transferredOn,
      transferredBy: d.transferredBy,
      reportableSiteId: d.reportableSiteId,
      diseaseExternalId: d.diseaseExternalId,
      diseaseName: d.diseaseName,
      // assay avatar
      assayAvatar: {
        contentI18nKey: d.contentI18nKey,
        contentText: d.contentText,
        backgroundColour: assayAvatar.backgroundColour,
        foregroundColour: assayAvatar.foregroundColour,
        contentIcon: assayAvatar.contentIcon,
      },
    }
  })

// Trasnformed data v2 for result by Id
const getTransformedDataOfResultById = (data, setDelivered, followUps, comments) => ({
  id: data.id,
  externalId: data.externalId,
  endedOn: returnIso8601StringWithoutTimeZoneOffset(data.endedOn),
  updatedOn: data.updatedOn,
  assayExternalId: data.assayExternalId,
  siteName: data.siteName,
  sampleOriginSiteId: data.sampleOriginSiteId,
  firstViewedOn: data.firstViewedOn ? data.firstViewedOn : null,
  deviceName: data.deviceName,
  resultCategory1ExternalId: data.resultCategory1ExternalId,
  resultCategory2ExternalId: data.resultCategory2ExternalId,
  patientData: data.patientData ? JSON.parse(data.patientData) : null,
  resultData: data.resultData
    ? _.pick(JSON.parse(data.resultData), ['resultText', 'copies', 'log', 'detectedResistance'])
    : null,
  sample: {
    id: data.sampleId,
    originSite: data.sampleOriginSiteId
      ? {
          externalId: data.sampleOriginSiteExternalId,
          name: data.sampleOriginSiteName,
        }
      : null,
  },
  workflowStatus: {
    name:
      setDelivered && data.resultWorkflowStatusExternalId !== 'Delivered' ? 'Delivered' : data.resultWorkflowStatusName,
    externalId:
      setDelivered && data.resultWorkflowStatusExternalId !== 'Delivered'
        ? 'Delivered'
        : data.resultWorkflowStatusExternalId,
    i18nKey:
      setDelivered && data.resultWorkflowStatusExternalId !== 'Delivered'
        ? 'ResultWorkflowStatusDelivered'
        : data.resultWorkflowStatusi18nKey,
    reason:
      setDelivered && data.resultWorkflowStatusExternalId !== 'Delivered'
        ? 'Download Results Api'
        : data.resultWorkflowStatusReason,
    changedOn:
      setDelivered && data.resultWorkflowStatusExternalId !== 'Delivered'
        ? new Date()
        : data.resultWorkflowStatusChangedOn,
    setDelivered: setDelivered && data.resultWorkflowStatusExternalId !== 'Delivered',
  },
  treatmentStatus: {
    changedOn: data.resultTreatmentStatusChangedOn,
    name: data.resultTreatmentStatusName,
    externalId: data.resultTreatmentStatusExternalId,
    i18nKey: data.resultTreatmentStatusi18nKey,
  },
  followUps: _.sortBy(
    _.filter(followUps, { resultId: data.id }).map(f => _.omit(f, 'resultId')),
    ['date', 'updatedOn']
  ),
  comments: _.orderBy(
    _.filter(comments, { resultId: data.id }).map(f => _.omit(f, 'resultId')),
    ['createdOn'],
    ['desc']
  ),
  // result transferred
  reportableSiteName: data.reportableSiteName,
  transferredOn: data.transferredOn,
  transferredBy: data.transferredBy,
  reportableSiteId: data.reportableSiteId,
  diseaseExternalId: data.diseaseExternalId,
  diseaseName: data.diseaseName,
})

module.exports = {
  getTransformedData,
  getTransformedDataV2,
  getTransformedDataOfResultById,
}
