const _ = require('lodash')
const dayjs = require('dayjs')
const { pipe, find, values } = require('ramda')
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

const showTreatment = testResult => {
  return !isTransferred(testResult) && requiresTreatment(testResult)
}

// get latest followup based on its type
const checkFollowupType = (testResult, followUp, type) => {
  const followUps = _.sortBy(
    _.filter(followUp, { resultId: testResult.id }).map(f => _.omit(f, 'resultId')),
    ['date', 'updatedOn']
  )
  const maxDate = new Date(
    Math.max(
      ...followUps.map(element => {
        return element.createdOn
      })
    )
  )
  const followUpDetail = pipe(
    values,
    find(followUpDetail => {
      if (
        followUpDetail.followUpTypeExternalId === type &&
        new Date(followUpDetail.createdOn).toISOString() === new Date(maxDate).toISOString()
      ) {
        return followUpDetail
      }
    })
  )(followUps)
  return followUpDetail
}

// Its number of days from the day treatment has started/updated
const daysFromTreatmentDateUpdateOn = (testResult, followUp) => {
  const isTreatment = checkFollowupType(testResult, followUp, 'treatment')
  return isTreatment ? dayjs().diff(dayjs(isTreatment.updatedOn), 'day') : 0
}

// Its number of days from the day treatment has started/updated
const daysFromTreatmentDateEndOn = (testResult, followUp) => {
  const isTreatment = checkFollowupType(testResult, followUp, 'treatment')
  return isTreatment ? dayjs().diff(dayjs(isTreatment.endedOn), 'day') : 0
}

const isTransferred = testResult => {
  const sample = {
    id: testResult.sampleId,
    originSite: testResult.sampleOriginSiteId
      ? {
          externalId: testResult.sampleOriginSiteExternalId,
          name: testResult.sampleOriginSiteName,
        }
      : null,
  }
  return !!testResult.transferredOn && sample.originSite.externalId !== testResult.reportableSiteId
}

// If result is returning require treatment true, i.e. patient needs treatment
const requiresTreatment = testResult => {
  return !!testResult.requiresTreatment
}

const getSeverity = (testResult, followUp) => {
  const daysDiff = daysFromTreatmentDateEndOn(testResult, followUp)
  const requireTreatment = requiresTreatment(testResult)
  const isOnTreatment = checkFollowupType(testResult, followUp, 'treatment')
  let severity = ''
  if (requireTreatment) {
    if (!isOnTreatment && daysDiff < 30) {
      severity = 'info'
    } else if (!isOnTreatment && daysDiff === 30) {
      severity = 'warning'
    } else if (!isOnTreatment && daysDiff > 30) {
      severity = 'danger'
    } else if (isOnTreatment) {
      severity = 'success'
    }
  } else {
    severity = 'info'
  }
  return severity
}

// transformed data
const getTransformedData = (data, setDelivered, followUps, comments) =>
  _.map(data, d => getResultItemTransformedData(d, setDelivered, followUps, comments))

// Trasnformed data v2
const getTransformedDataV2 = (data, setDelivered, followUps, comments) =>
  _.map(data, d => {
    return getResultItemTransformedDataV2(d, setDelivered, followUps, comments)
  })

const getResultItemTransformedData = (data, setDelivered, followUps, comments) => ({
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

// Trasnformed data v2 for result by Id
const getResultItemTransformedDataV2 = (data, setDelivered, followUps, comments) => {
  const assayAvatar = assayAvatarColorsIcon[data.diseaseExternalId]
    ? assayAvatarColorsIcon[data.diseaseExternalId]
    : assayAvatarColorsIcon.default
  const patientData = data.patientData ? JSON.parse(data.patientData) : null
  const mainData = {
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
    patientData,
    testId: patientData ? patientData.id : data.sampleId,
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
        setDelivered && data.resultWorkflowStatusExternalId !== 'Delivered'
          ? 'Delivered'
          : data.resultWorkflowStatusName,
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
      visible: showTreatment(data),
      severity: getSeverity(data, followUps),
      daysInCurrentStatus: daysFromTreatmentDateUpdateOn(data, followUps),
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
    assayAvatar: {
      contentI18nKey: data.contentI18nKey,
      contentText: data.contentText,
      backgroundColour: assayAvatar.backgroundColour,
      foregroundColour: assayAvatar.foregroundColour,
      contentIcon: assayAvatar.contentIcon,
    },
    testInformation: [],
  }
  if (data.resultCategory1) {
    const testInfo1 = {
      label: data.resultCategory1Label || null,
      labelI18nKey: data.resultCategory1I18nKey || null,
      value: data.resultCategory1Name || null,
      valueI18nKey: data.resultCategory1i18nKey || null,
      severity: data.resultCategory1Emphasize ? 'danger' : 'info',
    }
    mainData.testInformation.push(testInfo1)
  }
  if (data.resultCategory2) {
    const testInfo2 = {
      label: data.resultCategory2Label || null,
      labelI18nKey: data.resultCategory2I18nKey || null,
      value: data.resultCategory2Name || null,
      valueI18nKey: data.resultCategory2i18nKey || null,
      severity: data.resultCategory2Emphasize ? 'danger' : 'info',
    }
    mainData.testInformation.push(testInfo2)
  }
  if (data.copies && `${data.copies}`.toLowerCase().replace(/\s/g, '') !== 'null') {
    const testInfo3 = {
      label: `${data.copies} Copies/mL` || null,
      labelI18nKey: null,
      value: null,
      valueI18nKey: null,
      severity: 'info',
    }
    mainData.testInformation.push(testInfo3)
  }
  return mainData
}

module.exports = {
  getTransformedData,
  getTransformedDataV2,
  getResultItemTransformedData,
  getResultItemTransformedDataV2,
}
