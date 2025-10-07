const _ = require('lodash')
const { differenceInDays } = require('date-fns')
const { pipe, find, values } = require('ramda')
const { subDays } = require('date-fns')
const isValid = require('date-fns/isValid')
const { returnIso8601StringWithoutTimeZoneOffset } = require('../../../shared/date')
const { resultWorkflowStatusToId } = require('../../../shared/dictionary')
const { knex } = require('../../../db')

const TRANSFERRED = {
  AWAY: 'away',
  HERE: 'here',
}

const TESTTYPE = {
  RESULT: {
    i18nKey: 'testResult',
    text: 'Test Result',
  },
  SAMPLE: {
    i18nKey: 'sample',
    text: 'Sample',
  },
}

const ACKNOWLEDGED = 'Acknowledged'
const NOT_POSSIBLE_FOLLOW_UP_TYPE = 'notPossible'

const fieldNameToFollowUpTypeIdMappings = {
  treatment: 'treatment',
  outcome: 'outcome',
}

const assayAvatarColorsIcon = {
  tb: {
    backgroundColor: 'purple',
    foregroundColor: 'secondary',
    contentIcon: null,
  },
  hcv: {
    backgroundColor: 'secondary',
    foregroundColor: 'primary',
    contentIcon: null,
  },
  hiv: {
    backgroundColor: 'orange',
    foregroundColor: 'secondary',
    contentIcon: null,
  },
  ebola: {
    backgroundColor: 'secondary',
    foregroundColor: 'primary',
    contentIcon: null,
  },
  covid: {
    backgroundColor: 'purple',
    foregroundColor: 'secondary',
    contentIcon: null,
  },
  hbv: {
    backgroundColor: 'secondary',
    foregroundColor: 'primary',
    contentIcon: null,
  },
  default: {
    backgroundColor: 'orange',
    foregroundColor: 'secondary',
    contentIcon: null,
  },
}

const SAMPLE_STATUS_DAMAGED = {
  status: 'damaged',
  color: 'danger',
  title: 'Sample Damaged',
}

const SAMPLE_STATUS_LOST = {
  status: 'lost',
  color: 'danger',
  title: 'Sample Damaged',
}

const SAMPLE_STATUS_NOT_TESTED = {
  status: 'notTested',
  color: 'danger',
  title: 'Sample Not Damaged',
}

const SAMPLE_STATUS_REGISTER = {
  status: 'registered',
  color: 'success',
  title: 'Sample Registered',
}
// TODO: Get details from database. Currently Randomly generated sample status for sample damaged and sample lost case
const getSampleStatus = val => {
  let sampleStatus = [SAMPLE_STATUS_DAMAGED, SAMPLE_STATUS_LOST][_.random(0, 2)]
  if (!_.isNil(val)) {
    sampleStatus = val === 'danger' ? SAMPLE_STATUS_NOT_TESTED : SAMPLE_STATUS_REGISTER
  }
  return sampleStatus
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
      try {
        if (!followUpDetail?.createdOn || !maxDate) return false
        const createdOnDate = new Date(followUpDetail.createdOn)
        const maxDateObj = new Date(maxDate)
        if (!isValid(createdOnDate) || !isValid(maxDateObj)) return false
        return (
          followUpDetail.followUpTypeExternalId === type && createdOnDate.toISOString() === maxDateObj.toISOString()
        )
      } catch (error) {
        return false
      }
    })
  )(followUps)
  return followUpDetail
}

// Its number of days from the day treatment has started/updated
const daysFromTreatmentDateUpdateOn = testResult => {
  const today = new Date()
  return differenceInDays(today, new Date(testResult?.resultTreatmentStatusChangedOn || today))
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
  const daysDiff = daysFromTreatmentDateUpdateOn(testResult, followUp)
  const isOnTreatment = checkFollowupType(testResult, followUp, 'treatment')

  if (isOnTreatment) return 'success'
  if (daysDiff > 32) return 'danger'
  if (daysDiff > 16) return 'warning'
  return 'info'
}

// transformed data
const getTransformedData = (data, setDelivered, followUps) =>
  _.map(data, d => getResultItemTransformedData(d, setDelivered, followUps))

// Transformed data v2
const getTransformedDataV2 = async (data, setDelivered, followUps) => {
  const transformedData = await Promise.all(
    _.map(data, async d => {
      const resultItem = await getResultItemTransformedDataV2(d, setDelivered, followUps)
      return resultItem
    })
  )
  return transformedData
}

const getResultItemTransformedData = (data, setDelivered, followUps) => ({
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
  comments: [],
  // result transferred
  reportableSiteName: data.reportableSiteName,
  transferredOn: data.transferredOn,
  transferredBy: data.transferredBy,
  reportableSiteId: data.reportableSiteId,
  diseaseExternalId: data.diseaseExternalId,
  diseaseName: data.diseaseName,
})

// clinical response : get result details by result ID
async function getResultByResultId(
  auth,
  resultId,
  dataConstraints,
  userName,
  results,
  latestFollowUps,
  resultWorkflowlog,
  getAssayForResultFollowup,
  getFileReferencesForResultFolloup,
  addConstraints,
  showResultFolloup,
  getResultNotesByResultIdForResultFollowup
) {
  let data = null
  // translate result data back to an object and get assay details
  // if selecting the result was successful
  if (results.length === 1) {
    ;[data] = results
    if (data.resultData) {
      data.resultData = JSON.parse(data.resultData)
      // full result text for the result details page
      data.fullResultText = data.resultData.resultText
    }

    if (data.formData) {
      data.formData = JSON.parse(data.formData)
    }
    if (data.patientData) {
      data.patientData = JSON.parse(data.patientData)
    }
    if (data.assayId) {
      data.assay = await getAssayForResultFollowup(data)
      if (data.assay.resultDataSchema) {
        data.assay.resultDataSchema = JSON.parse(data.assay.resultDataSchema)
      }
      if (data.assay.patientDataSchema) {
        data.assay.patientDataSchema = JSON.parse(data.assay.patientDataSchema)
      }
    }
    // select files attached to this result
    const { data: files } = await showFileReferencesById(
      resultId,
      dataConstraints,
      addConstraints,
      getFileReferencesForResultFolloup
    )
    data.files = files

    const { data: followUps } = await showResultFollowUps(resultId, dataConstraints, showResultFolloup)
    data.followUps = followUps
  }

  if (latestFollowUps) {
    const treatment = _.find(latestFollowUps, f => f.followUpTypeExternalId === 'treatment')
    const outcome = _.find(latestFollowUps, f => f.followUpTypeExternalId === 'outcome')
    const acknowledgedId = await resultWorkflowStatusToId(ACKNOWLEDGED)
    data.clinicalResponse = {
      recorded: resultWorkflowlog[0].resultWorkflowStatusId === acknowledgedId,
      confirmedOn: resultWorkflowlog[0].changedOn,
      treatment: treatment?.externalId,
      treatmentStarted: treatment?.date,
      outcome: outcome?.externalId,
      outcomeOccurred: outcome?.date,
    }
  }

  if (data) {
    getResultTreatmentStatus(data)
    data.resultNotes = await getResultNotesByResultId(resultId, getResultNotesByResultIdForResultFollowup)
    data.resultTreatmentStatusCreatedBy = userName

    if (data.resultData && data.resultData.detectedResistance && data.resultData.detectedResistance.length > 0)
      data.detectedResistance = data.resultData.detectedResistance.join(', ')

    data.customFieldsValues = await getCustomFieldsForResult(data)
  }

  return { ok: results.length === 1, data }
}

// Supporting function : getResultByResultId
async function getCustomFieldsForResult(data) {
  const { deviceId, partnerId, partnerPluginName, deviceTypePluginName } = data
  const { getCustomFields } = require('../../../deviceApi/service')
  const customFieldsRaw = await getCustomFields({
    knex,
    device: { id: deviceId, partnerId },
    partnerPluginName,
    deviceTypePluginName,
  })
  let customFields = customFieldsRaw?.CustomFields?.Fields || []
  customFields = _.sortBy(customFields, ['DisplayOrder', 'Name'])
  const customFieldsValues = customFields.map(it => ({
    caption: it.Label,
    externalId: `patientData.${_.camelCase(it.ExternalId)}`,
  }))
  return customFieldsValues
}

// Supporting function : getResultByResultId
async function showFileReferencesById(resultId, dataConstraints, addConstraints, getFileReferencesForResultFolloup) {
  const fileReferences = await getFileReferencesForResultFolloup(resultId, dataConstraints).then(items =>
    items.map(ref => {
      ref.url = `/result/file/${resultId}/${ref.id}/${ref.name}`
      return ref
    })
  )
  return { data: fileReferences }
}

// Supporting function : getResultByResultId
async function showResultFollowUps(resultId, dataConstraints, showResultFolloup) {
  const followUps = await showResultFolloup(resultId, dataConstraints)
  return { data: followUps }
}

// Supporting function : getResultByResultId
function getResultTreatmentStatus(response) {
  if (response.requiresTreatment) {
    const today = new Date()
    const lastSixteenDays = subDays(today, 16)
    const lastThirtyTwoDays = subDays(today, 32)
    const isPastThirtyTwoDays = response.endedOn <= lastThirtyTwoDays
    const isPastSixteenDays = response.endedOn <= lastSixteenDays && response.endedOn > lastThirtyTwoDays
    if (response.resultTreatmentStatus === 'OnTreatment') {
      response.treatmentStatusInfo = 'ok'
    } else if (response.resultTreatmentStatus === 'NotPossible') {
      response.treatmentStatusInfo = 'na'
    } else if (isPastThirtyTwoDays) {
      response.treatmentStatusInfo = 'alert'
    } else if (isPastSixteenDays) {
      response.treatmentStatusInfo = 'warning'
    } else {
      response.treatmentStatusInfo = 'na'
    }
  } else {
    response.treatmentStatusInfo = null
  }
}

// Supporting function : getResultByResultId
async function getResultNotesByResultId(resultId, getResultNotesByResultIdForResultFollowup) {
  const resultNotes = await getResultNotesByResultIdForResultFollowup(resultId)
  return resultNotes
}

// refactor transformPatientDataBySchema to use lodash map
function transformPatientDataBySchema(patientData, patientDataSchema) {
  const transformedData = _.map(patientDataSchema, (value, key) => {
    return {
      key,
      value: patientData[key],
      title: value.title,
      order: value.order,
    }
  })
  return _.orderBy(transformedData, ['order'], ['asc'])
}

// Transformed data v2 for result by Id
const getResultItemTransformedDataV2 = async (data, setDelivered, followUps, acknowledgement) => {
  const assayAvatar = assayAvatarColorsIcon[data.diseaseExternalId]
    ? assayAvatarColorsIcon[data.diseaseExternalId]
    : assayAvatarColorsIcon.default
  const followUpList = _.sortBy(
    _.filter(followUps, { resultId: data.id }).map(f => _.omit(f, 'resultId')),
    ['date', 'updatedOn']
  )
  const latestFollowUps = getLatestFollowUpsFromFollowUps(followUpList)
  const patientData = data.patientData ? JSON.parse(data.patientData) : null
  const patientDataSchema = data.patientDataSchema ? JSON.parse(data.patientDataSchema) : null
  const resultData = data.resultData
    ? _.pick(JSON.parse(data.resultData), ['resultText', 'copies', 'log', 'detectedResistance'])
    : null
  const severity = getSeverity(data, followUps)
  const resultRequiresTreatment = !!(data.requiresTreatment || data.requiresTreatment2)
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
    patientData: transformPatientDataBySchema(patientData, patientDataSchema),
    testId: patientData ? patientData.id : data.sampleId,
    resultData,
    sample: {
      id: data.sampleId,
      originSite: data.sampleOriginSiteId
        ? {
            id: data.sampleOriginSiteId,
            externalId: data.sampleOriginSiteExternalId,
            name: data.sampleOriginSiteName,
          }
        : null,
      sampleCollectionDate: data.sampleCollectionOn,
      ...getSampleStatus(severity),
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
      severity,
      daysInCurrentStatus: daysFromTreatmentDateUpdateOn(data, followUps),
    },
    followUps: followUpList,
    comments: [],
    // result transferred
    reportableSiteName: data.reportableSiteName,
    testType: resultData ? TESTTYPE.RESULT : TESTTYPE.SAMPLE,
    transferred: isTransferred ? TRANSFERRED.AWAY : TRANSFERRED.HERE,
    transferredOn: data.transferredOn,
    transferredBy: data.transferredBy,
    reportableSiteId: data.reportableSiteId,
    diseaseExternalId: data.diseaseExternalId,
    diseaseName: data.diseaseName,
    assayAvatar: {
      contentI18nKey: data.contentI18nKey,
      contentText: data.contentText,
      backgroundColor: assayAvatar.backgroundColor,
      foregroundColor: assayAvatar.foregroundColor,
      contentIcon: assayAvatar.contentIcon,
    },
    clinicalResponse: {
      recorded: !!acknowledgement,
      confirmedOn: acknowledgement?.acknowledgedOn ?? null,
    },
    testInformation: [],
    resultRequiresTreatment,
  }
  if (latestFollowUps.length > 0) {
    const treatment = _.find(
      latestFollowUps,
      f => f.followUpTypeExternalId === fieldNameToFollowUpTypeIdMappings.treatment
    )
    const outcome = _.find(latestFollowUps, f => f.followUpTypeExternalId === fieldNameToFollowUpTypeIdMappings.outcome)
    mainData.clinicalResponse = {
      ...mainData.clinicalResponse,
      treatment: treatment?.externalId || null,
      treatmentStarted: treatment?.date || null,
      outcome: outcome?.externalId || null,
      outcomeOccurred: outcome?.date || null,
    }
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

const getLatestFollowUpsFromFollowUps = (followUps = []) => {
  const latestTreatment = _.sortBy(
    followUps.filter(f => f.followUpTypeExternalId === fieldNameToFollowUpTypeIdMappings.treatment),
    f => f.date
  ).reverse()[0]
  const latestOutcome = _.sortBy(
    followUps.filter(f => f.followUpTypeExternalId === fieldNameToFollowUpTypeIdMappings.outcome),
    f => f.date
  ).reverse()[0]
  return [latestTreatment, latestOutcome].filter(_.identity)
}

module.exports = {
  getTransformedData,
  getTransformedDataV2,
  getResultByResultId,
  getResultItemTransformedData,
  getResultItemTransformedDataV2,
  fieldNameToFollowUpTypeIdMappings,
  getLatestFollowUpsFromFollowUps,
  getCustomFieldsForResult,
  ACKNOWLEDGED,
  NOT_POSSIBLE_FOLLOW_UP_TYPE,
}
