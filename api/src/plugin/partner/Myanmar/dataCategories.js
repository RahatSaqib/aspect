const _ = require('lodash')

// --------------
// values for data category fields
// --------------
const dictHivStatus = [
  'Positive',
  'Negative',
  'Unknown',
  'HIV Positive',
  'HIV Negative',
  'HIV Unknown',
  'Not on Form',
]
const dictMdr = [
  'On Treatment',
  'Previously Treated',
  'Unknown',
  'No Previous Treatment',
  'No',
  'Yes',
  'false',
  'true',
  'Not on Form',
]
const dictSmear = [
  'Smear Negative',
  'Smear Positive',
  'Negative',
  'Positive',
  'Not Done',
  'Not on Form',
]
// --------------
// custom fields
// --------------
const dictSampleTypes = [
  'CSF',
  'Other',
  'Saliva',
  'Pus',
  'Not on Form',
  'Blood',
  'Sputum',
  'Effusion',
]
const dictOtherReason = [
  'MDR Contact',
  'Not on Form',
  'Smear Positive Month 2 Treatment',
  'EPTB Suspect',
  'Diabetes mellitus',
  'Smear Positive Month 5 Treatment',
]
const dictReferralCenter = [
  'BGL TBC',
  'PSI BGL',
  'Not on Form',
  'MMA BGL',
  'DNB TBC',
  'MMA DNB',
]

const dataCategories = [
  {
    name: 'HIV+',
    fieldNames: 'hivStatus',
    // partnerId,
    externalId: 'HivStatus',
    i18nKey: 'dataCategoryHiv',
    validValues: JSON.stringify(dictHivStatus.filter(x => x !== 'Not on Form')),
    invalidValues: JSON.stringify(
      dictHivStatus.filter(x => x === 'Not on Form')
    ),
    cutoffPercentage: 98,
  },
  {
    name: 'MDR',
    fieldNames: 'previouslyTreated',
    // partnerId,
    externalId: 'PreviouslyTreated',
    i18nKey: 'dataCategoryMdr',
    validValues: JSON.stringify(dictMdr.filter(x => x !== 'Not on Form')),
    invalidValues: JSON.stringify(dictMdr.filter(x => x === 'Not on Form')),
    cutoffPercentage: 98,
  },
  {
    name: 'Smear+',
    fieldNames: 'microscopyResult',
    // partnerId,
    externalId: 'MicroscopyResult',
    i18nKey: 'dataCategorySmear',
    validValues: JSON.stringify(
      dictSmear.filter(x => x !== 'Not on Form' && x !== 'Not Done')
    ),
    invalidValues: JSON.stringify(
      dictSmear.filter(x => x === 'Not on Form' || x === 'Not Done')
    ),
    cutoffPercentage: 98,
  },
  {
    name: 'Other',
    fieldNames: '["city", "gender", "age", "sampleType"]',
    // partnerId,
    externalId: 'Other',
    i18nKey: 'dataCategoryOther',
    // ----------------------
    // missing of valid/invalidValues here means that if field is in patientData json and is
    // not undefined, null or empty string - it is considered as valid
    // Notice: field 'sampleType' means 'sampleTypeId' in Sample table - for 'Other' category
    // be valid field Sample.sampleTypeId should  NOT be null.
    // ----------------------
    // see func getDataCategoryStatus( in /fact/service.js
    // ----------------------
    cutoffPercentage: 98,
  },
]

// helper function
function getRandomValue(arr, pc = 2) {
  // return values ony in 98% of cases
  if (99 - _.random(99) < pc) return undefined
  return _.isArray(arr)
    ? arr[_.random(arr.length - 1)]
    : `Some string - ${_.random(1000000)}`
}

// -------------------------------------------------------
// getPatients
// -------------------------------------------------------
function addDataCategoryFields(samplePatients) {
  return _.each(samplePatients, p => {
    _.set(p, 'hivStatus', getRandomValue(dictHivStatus, 50))
    _.set(p, 'previouslyTreated', getRandomValue(dictMdr))
    _.set(p, 'microscopyResult', getRandomValue(dictSmear))
    _.set(p, 'sampleType', getRandomValue(dictSampleTypes))
    _.set(p, 'otherReason', getRandomValue(dictOtherReason))
    _.set(p, 'referralCenter', getRandomValue(dictReferralCenter))
    _.set(p, 'otherNotes', getRandomValue())
  })
}

module.exports = {
  dataCategories,
  addDataCategoryFields,
}
