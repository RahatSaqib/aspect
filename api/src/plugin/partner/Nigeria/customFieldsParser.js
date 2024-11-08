const _ = require('lodash')

const hivRegex =
  /HIV.?POSITIVE|HIV.?POS|HIV[\s=\-]*P|HIV\+|HIV.?UNK(NOWN)|HIV.?\?|HIV.?NEGATIVE|HIV.?NEG|HIV[\s=\-]*N|HIV-/i
const drRegex = /(^|\s)(dr[\?]),?($|\s)/i
const ageYearsRegex = /(^|,|\s|:)([1]?[0-9]{1,2})(YRS|YEARS|,)?($|\s|,|\/)/i
const genderRegex = /\b(female|male|m|f)\b/i

// Ad-hoc parser for legacy custom fields in Nigeria using 'result.notes' field.
// see: https://github.com/SystemOneId/GxAlert/blob/6f3bc6fac9b92ad9e3cf45f6bc7dff541c7f4d29/Utilities/Parsing.cs#L971
function parseNotes(notes) {
  const patientData = {}

  if (!_.isString(notes)) {
    return { patientData }
  }

  let cleanedNotes = notes

  if (
    !notes ||
    /^\s*$/.test(notes) ||
    notes.startsWith('operation terminated error') ||
    notes.startsWith('Post-run analysis error') ||
    notes.startsWith('error occurred') ||
    notes.startsWith('nomadic project')
  ) {
    return { patientData }
  }

  notes = notes.trim().replace('\n', ' ')

  if (!hivRegex.test(notes) && !drRegex.test(notes) && !genderRegex.test(notes) && !ageYearsRegex.test(notes)) {
    return { patientData }
  }

  // HIV status
  if (/HIV.?POSITIVE|HIV.?POS|HIV[\s=\-]*P|HIV\+/i.test(notes)) patientData.HivStatus = 'HIV Positive'
  else if (/HIV.?UNK(NOWN)|HIV.?\?/i.test(notes)) patientData.HivStatus = 'HIV Unknown'
  else if (/HIV.?NEGATIVE|HIV.?NEG|HIV[\s=\-]*N|HIV-/i.test(notes)) patientData.HivStatus = 'HIV Negative'

  // DR suspect
  const drMatch = notes.match(drRegex)
  if (drMatch && drMatch[2].toLowerCase() === 'dr?') {
    patientData.DrSuspect = 1
    cleanedNotes = cleanedNotes.replace(/dr\?/i, ' ')
  }

  // Age
  const ageMatch = notes.match(ageYearsRegex)
  if (ageMatch) {
    const parsedAgeInYears = parseInt(ageMatch[2], 10)
    if (parsedAgeInYears >= 0 && parsedAgeInYears <= 120) {
      patientData.PatientAge = parsedAgeInYears
      cleanedNotes = cleanedNotes.replace(ageMatch[2], '')
    }
  }

  // Gender
  const femaleRegex = /\b(female|f)\b/i
  const maleRegex = /\b(male|m)\b/i

  if (notes.match(femaleRegex)) {
    patientData.PatientGender = 'Female'
  } else if (notes.match(maleRegex)) {
    patientData.PatientGender = 'Male'
  }

  if (
    patientData.HivStatus !== null ||
    patientData.DrSuspect === 1 ||
    patientData.PatientAge !== null ||
    patientData.PatientGender !== null
  ) {
    cleanedNotes = cleanNotes(cleanedNotes)
    patientData.PatientStreet =
      cleanedNotes && cleanedNotes.length > 255 ? cleanedNotes.substring(0, 255) : cleanedNotes
  }

  return { patientData }
}

function cleanNotes(notes) {
  const stringsToRemove = [
    'nte',
    ',',
    '\\.',
    'years',
    'yrs',
    '\\bage\\b',
    '\\bold\\b',
    '\\bfrom\\b',
    'plhiv',
    'routine',
    'relapse',
    'purulent',
    'mucopurulent',
    'mucoid',
    'mucosalivary',
    'diagnosis',
    'plhiv with symptoms of tb',
    'sputum sample',
    'test',
    'testrunning',
    'symptomatic',
    'presumptive',
    'm?p,\\s*?\\d*m?l',
    'with symptoms of tb',
  ]

  stringsToRemove.forEach(s => {
    notes = notes.replace(new RegExp(s, 'ig'), '')
  })

  notes = notes.replace(genderRegex, '')
  notes = notes.replace(hivRegex, '')
  notes = notes.replace(/[ \t]{2,}/g, ' ')
  return notes.trim()
}
module.exports = { parseNotes }
