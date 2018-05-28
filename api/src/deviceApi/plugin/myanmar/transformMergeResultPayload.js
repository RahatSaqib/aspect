const _ = require('lodash')

async function transformMergeResultPayload(context) {
  const { knex, deviceType } = context
  const { plugin } = await knex('DeviceType')
    .where('externalId', deviceType)
    .first('plugin')
  const { loadPlugin } = require('../registration')
  const deviceTypeTransformMergeResultPayload = await loadPlugin(
    [plugin],
    'transformMergeResultPayload'
  )
  const transformedPayload = await deviceTypeTransformMergeResultPayload(
    context
  )
  if (deviceType === 'CepheidGeneXpert') {
    parseNotes(transformedPayload)
    parsePatientId(transformedPayload)
  }
  return transformedPayload
}

function parseNotes(payload) {
  let notes = _.get(payload, 'notes')
  if (
    !notes ||
    notes.indexOf('operation terminated error') >= 0 ||
    notes.indexOf('Post-run analysis error') >= 0 ||
    notes.indexOf('error occurred') >= 0 ||
    notes.indexOf('nomadic project') >= 0
  ) {
    return
  }
  if (notes.indexOf('\r') > -1) {
    notes = notes.substr(0, notes.indexOf('\r'))
  }
  if (notes.indexOf('\n') > -1) {
    notes = notes.substr(0, notes.indexOf('\n'))
  }
  let cleanedNotes = notes
  const hivStatusRegex = /(^|\s|,)(hiv([+]|[-]|[?])),?($|\s|,)/i
  const hivStatusMatches = notes.match(hivStatusRegex) || []

  const ageInYearsRegex = /(^|\s|,)([1]?[0-9]{1,2}),?($|\s|,)/i
  const ageInYearsMatches = notes.match(ageInYearsRegex) || []
  const genderRegex = /(^|\s|,)([m]|[f]),?($|\s|,)/i
  const genderMatches = notes.match(genderRegex) || []

  if (
    _.isEmpty(hivStatusMatches) &&
    _.isEmpty(ageInYearsMatches) &&
    _.isEmpty(genderMatches)
  ) {
    return
  }

  const existingHivStatus = _.get(payload, 'patient.hivStatus')
  if (!_.isEmpty(hivStatusMatches) && !existingHivStatus) {
    const capturedHivStatus = hivStatusMatches[2].toLowerCase().trim()
    if (capturedHivStatus === 'hiv+') {
      _.set(payload, 'patient.hivStatus', 'HIV Positive')
    } else if (capturedHivStatus === 'hiv-') {
      _.set(payload, 'patient.hivStatus', 'HIV Negative')
    } else if (capturedHivStatus === 'hiv?') {
      _.set(payload, 'patient.hivStatus', 'HIV Unknown')
    }
    cleanedNotes = cleanedNotes.replace(hivStatusRegex, '')
  }

  let ageInYears = null
  const existingAgeInYears = _.get(payload, 'patient.age')
  if (!_.isEmpty(ageInYearsMatches)) {
    const capturedAgeInYears = ageInYearsMatches[2].toLowerCase().trim()
    ageInYears = parseInt(capturedAgeInYears, 10)
    cleanedNotes = cleanedNotes.replace(ageInYearsRegex, '')
  }
  if (ageInYears && !existingAgeInYears) {
    _.set(payload, 'patient.age', ageInYears)
  }

  const existingGender = _.get(payload, 'patient.gender')
  if (!_.isEmpty(genderMatches) && !existingGender) {
    const capturedGender = genderMatches[2].toLowerCase().trim()
    if (capturedGender === 'm') {
      _.set(payload, 'patient.gender', 'Male')
    } else if (capturedGender === 'f') {
      _.set(payload, 'patient.gender', 'Female')
    }
    cleanedNotes = cleanedNotes.replace(genderRegex, '')
  }

  const phoneNumberRegex = /([(0)]*\+?(?:95)?)(\d{7,10})/i
  const phoneNumberMatches = cleanedNotes.match(phoneNumberRegex) || []
  const existingPhoneNumber = _.get(payload, 'patient.phone')
  if (
    !_.isEmpty(phoneNumberMatches) &&
    phoneNumberMatches.length > 2 &&
    phoneNumberMatches[2].trim().length > 0 &&
    !existingPhoneNumber
  ) {
    _.set(payload, 'patient.phone', phoneNumberMatches[2].trim())
  }

  const existingPreviouslyTreated = _.get(payload, 'patient.previouslyTreated')
  if (!existingPreviouslyTreated) {
    if (cleanedNotes.toLowerCase().indexOf('yes') > -1) {
      _.set(payload, 'patient.previouslyTreated', 'Yes')
    } else if (cleanedNotes.toLowerCase().indexOf('no') > -1) {
      _.set(payload, 'patient.previouslyTreated', 'No')
    } else if (cleanedNotes.toLowerCase().indexOf('unk') > -1) {
      _.set(payload, 'patient.previouslyTreated', 'Unknown')
    }
  }

  const existingMicroscopyResult = _.get(payload, 'patient.microscopyResult')
  if (!existingMicroscopyResult) {
    if (cleanedNotes.toLowerCase().indexOf('pos') > -1) {
      _.set(payload, 'patient.microscopyResult', 'Positive')
    } else if (cleanedNotes.toLowerCase().indexOf('neg') > -1) {
      _.set(payload, 'patient.microscopyResult', 'Negative')
    } else if (cleanedNotes.toLowerCase().indexOf('nd') > -1) {
      _.set(payload, 'patient.microscopyResult', 'Not Done')
    }
  }

  const existingTestReasonShortName = _.get(payload, 'data.testReasonShortName')
  if (!existingTestReasonShortName) {
    const testReasonRegex = /(Dx|Fu|Na)/i
    const testReasonMatches = cleanedNotes.match(testReasonRegex) || []
    if (!_.isEmpty(testReasonMatches)) {
      _.set(payload, 'data.testReasonShortName', testReasonMatches[1])
    }
  }
}

function parsePatientId(payload) {
  const patientId = _.get(payload, 'patient.id')
  const indexOfFirstSeparator = patientId.indexOf(',')
  if (!patientId || indexOfFirstSeparator <= 0) {
    return
  }
  const existingCity = _.get(payload, 'patient.city')
  if (!existingCity) {
    const city = patientId.substr(indexOfFirstSeparator + 1).trim()
    _.set(payload, 'patient.city', city)
    _.set(payload, 'patient.id', patientId.substr(0, indexOfFirstSeparator))
  }
}

module.exports = transformMergeResultPayload
