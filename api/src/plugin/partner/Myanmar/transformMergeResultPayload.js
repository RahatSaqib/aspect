const _ = require('lodash')
const Promise = require('bluebird')
const {
  sampleTypeToId,
  deviceTypeToPlugin,
} = require('../../../shared/dictionary')

async function transformMergeResultPayload(context) {
  const { knex, deviceType } = context
  const plugin = await deviceTypeToPlugin(deviceType)
  const { loadPlugin } = require('../../registration')
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
    await parseCustomFields(transformedPayload, knex)
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

  if (!patientId) return

  const indexOfFirstSeparator = patientId.indexOf(',')
  if (indexOfFirstSeparator <= 0) {
    return
  }
  const existingCity = _.get(payload, 'patient.city')
  if (!existingCity) {
    const city = patientId.substr(indexOfFirstSeparator + 1).trim()
    _.set(payload, 'patient.city', city)
    _.set(payload, 'patient.id', patientId.substr(0, indexOfFirstSeparator))
  }
}

async function parseCustomFields(payload /* , knex */) {
  const customFieldData = _.get(payload, 'data.customFieldData')
  if (_.isEmpty(customFieldData)) {
    return
  }
  const customFieldMappings = {
    'PatientName (enter 99 if not on form)': 'patientName',
    'Patient Age (enter 99 if not on form)': 'patientAge',
    Sex: 'patientGender',
    'Sample Type': 'sampleType',
    'HIV Status': 'patientHivStatus',
    'Microscopy Result': 'patientMicroscopyResult',
    'Previous Treatment History': 'patientPreviouslyTreated',
    'Other Reason for Test': 'otherReasonForTest',
    'Patient Township': 'patientTownship',
    'Referral Center': 'referralCenter',
    'Other Notes': 'otherNotes',
  }
  const customFieldValues = _.reduce(
    _.filter(_.values(customFieldData), {
      notAvailable: false,
    }),
    (customFieldValues, customFieldValue) => {
      const mappedCustomFieldValue = {}
      if (Object.keys(customFieldMappings).includes(customFieldValue.label)) {
        mappedCustomFieldValue[customFieldMappings[customFieldValue.label]] =
          customFieldValue.value
      }
      return _.assign({}, customFieldValues, mappedCustomFieldValue)
    },
    {}
  )
  if (customFieldValues.patientName) {
    if (customFieldValues.patientName.trim().lastIndexOf(' ') > 0) {
      _.set(
        payload,
        'patient.name',
        customFieldValues.patientName
          .trim()
          .substr(0, customFieldValues.patientName.trim().lastIndexOf(' '))
      )
      _.set(
        payload,
        'patient.surname',
        customFieldValues.patientName
          .trim()
          .substr(customFieldValues.patientName.trim().lastIndexOf(' ') + 1)
      )
    } else {
      _.set(payload, 'patient.name', customFieldValues.patientName.trim())
    }
  }
  if (customFieldValues.patientAge) {
    const ageInYears = parseInt(customFieldValues.patientAge, 10)
    if (ageInYears) {
      _.set(payload, 'patient.age', ageInYears)
    }
  }
  if (customFieldValues.patientGender) {
    if (customFieldValues.patientGender === 'M') {
      _.set(payload, 'patient.gender', 'Male')
    } else if (customFieldValues.patientGender === 'F') {
      _.set(payload, 'patient.gender', 'Female')
    }
  }
  if (customFieldValues.patientHivStatus) {
    if (customFieldValues.patientHivStatus === 'Positive') {
      _.set(payload, 'patient.hivStatus', 'HIV Positive')
    } else if (customFieldValues.patientHivStatus === 'Negative') {
      _.set(payload, 'patient.hivStatus', 'HIV Negative')
    } else if (customFieldValues.patientHivStatus === 'Unknown') {
      _.set(payload, 'patient.hivStatus', 'HIV Unknown')
    } else {
      const existingHivStatus = _.get(payload, 'patient.hivStatus')
      if (!existingHivStatus) {
        _.set(payload, 'patient.hivStatus', customFieldValues.patientHivStatus)
      }
    }
  }
  if (customFieldValues.patientMicroscopyResult) {
    if (customFieldValues.patientMicroscopyResult === 'Smear Positive') {
      _.set(payload, 'patient.microscopyResult', 'Positive')
    } else if (customFieldValues.patientMicroscopyResult === 'Smear Negative') {
      _.set(payload, 'patient.microscopyResult', 'Negative')
    } else {
      const existingMicroscopyResult = _.get(
        payload,
        'patient.microscopyResult'
      )
      if (!existingMicroscopyResult) {
        _.set(
          payload,
          'patient.microscopyResult',
          customFieldValues.patientMicroscopyResult
        )
      }
    }
  }
  if (customFieldValues.patientPreviouslyTreated) {
    if (customFieldValues.patientPreviouslyTreated === 'Previously Treated') {
      _.set(payload, 'patient.previouslyTreated', 'Yes')
    } else if (
      customFieldValues.patientPreviouslyTreated === 'No Previous Treatment'
    ) {
      _.set(payload, 'patient.previouslyTreated', 'No')
    } else {
      const existingPreviouslyTreated = _.get(
        payload,
        'patient.previouslyTreated'
      )
      if (!existingPreviouslyTreated) {
        _.set(
          payload,
          'patient.previouslyTreated',
          customFieldValues.patientPreviouslyTreated
        )
      }
    }
  }
  if (customFieldValues.sampleType) {
    const existingSampleType = _.get(payload, 'sample.type')
    if (!existingSampleType) {
      const customSampleTypeId = await sampleTypeToId(
        _.get(customFieldValues, 'sampleType', '')
      )
      if (customSampleTypeId != null) {
        _.set(payload, 'sample.type.id', customFieldValues.sampleType)
      }
    }
  }
  if (customFieldValues.patientTownship) {
    _.set(payload, 'data.patientTownship', customFieldValues.patientTownship)
  }
  if (customFieldValues.otherReasonForTest) {
    _.set(
      payload,
      'data.otherReasonForTest',
      customFieldValues.otherReasonForTest
    )
  }
  if (customFieldValues.referralCenter) {
    _.set(payload, 'data.referralCenter', customFieldValues.referralCenter)
  }
  if (customFieldValues.otherNotes) {
    _.set(payload, 'data.otherNotes', customFieldValues.otherNotes)
  }
  return Promise.resolve()
}

module.exports = transformMergeResultPayload
