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
const getTransformedDataV2 = (data, setDelivered, followUps, comments, testInformation) =>
  _.map(data, d => {
    const assayAvatar = assayAvatarColorsIcon[d.diseaseExternalId]
      ? assayAvatarColorsIcon[d.diseaseExternalId]
      : assayAvatarColorsIcon.default
    const testInfoDetails = _.filter(testInformation, { resultId: d.id }).map(f => {
      _.omit(f, 'resultId')
      {
        const testInfoData = []
        if (f.resultCategory1) {
          const testInfo1 = {
            label: f.resultCategory1Label || null,
            labelI18nKey: f.resultCategory1I18nKey || null,
            value: f.resultCategory1Name || null,
            valueI18nKey: f.resultCategory1i18nKey || null,
            severity: f.resultCategory1Emphasize ? 'danger' : 'info',
          }
          testInfoData.push(testInfo1)
        }
        if (f.resultCategory2) {
          const testInfo2 = {
            label: f.resultCategory2Label || null,
            labelI18nKey: f.resultCategory2I18nKey || null,
            value: f.resultCategory2Name || null,
            valueI18nKey: f.resultCategory2i18nKey || null,
            severity: f.resultCategory2Emphasize ? 'danger' : 'info',
          }
          testInfoData.push(testInfo2)
        }
        if (f.copies) {
          const testInfo3 = {
            label: !!f.copies && f.copies !== 'null' ? `${f.copies} Copies/mL` : null,
            labelI18nKey: null,
            value: null,
            valueI18nKey: null,
            severity: 'info',
          }
          testInfoData.push(testInfo3)
        }
        return testInfoData
      }
    })
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
        visible: showTreatment(d),
        severity: getSeverity(d, followUps),
        daysInCurrentStatus: daysFromTreatmentDateUpdateOn(d, followUps),
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
      testInformation: testInfoDetails[0],
    }
  })

// Trasnformed data v2 for result by Id
const getTransformedDataOfResultById = (data, setDelivered, followUps, comments, testInformation) => {
  const assayAvatar = assayAvatarColorsIcon[data.diseaseExternalId]
    ? assayAvatarColorsIcon[data.diseaseExternalId]
    : assayAvatarColorsIcon.default
  const testDetails = testInformation.map(f => {
    _.omit(f, 'resultId')
    {
      const testInfoData = []
      if (f.resultCategory1) {
        const testInfo1 = {
          label: f.resultCategory1Label || null,
          labelI18nKey: f.resultCategory1I18nKey || null,
          value: f.resultCategory1Name || null,
          valueI18nKey: f.resultCategory1i18nKey || null,
          severity: f.resultCategory1Emphasize ? 'danger' : 'info',
        }
        testInfoData.push(testInfo1)
      }
      if (f.resultCategory2) {
        const testInfo2 = {
          label: f.resultCategory2Label || null,
          labelI18nKey: f.resultCategory2I18nKey || null,
          value: f.resultCategory2Name || null,
          valueI18nKey: f.resultCategory2i18nKey || null,
          severity: f.resultCategory2Emphasize ? 'danger' : 'info',
        }
        testInfoData.push(testInfo2)
      }
      if (f.copies) {
        const testInfo3 = {
          label: `${f.copies} Copies/mL` || null,
          labelI18nKey: null,
          value: null,
          valueI18nKey: null,
          severity: 'info',
        }
        testInfoData.push(testInfo3)
      }
      return testInfoData
    }
  })
  return {
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
    testInformation: testDetails[0],
  }
}

module.exports = {
  getTransformedData,
  getTransformedDataV2,
  getTransformedDataOfResultById,
}
