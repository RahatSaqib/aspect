const startOfRegex = /^\s*/
// const separator = /(?:\s?,\s?)?/
const separator = /(?:\s?,\s?)?/


// Ad-hoc parser for legacy custom fields in Myanmar using 'result.notes' field.
// see: https://github.com/SystemOneId/GxAlert/blob/b3c327a9199cfb1985750a53cd326706ece74253/Utilities/Parsing.cs#L936
// for the original implementation in GxAlert and https://github.com/SystemOneId/aspect/commit/4cfe1068154618ac9597b2d7ab4de07cb63182dd
// for the original implementation in Aspect (never released to production).


function parseNotes(notes) {
  const patientData = {}
  const rawValues = getNotesValues(notes)

  const { age, gender, previous, hiv, reasons, microscopy, specimen } = rawValues

  if (age) {
    patientData.PatientAge = +age
  }
  if (gender) {
    patientData.PatientGender = genderMap[gender]
  }
  if (previous) {
    patientData.PreviousTreatmentHistory = previousMap[previous]
  }
  if (hiv) {
    patientData.HivStatus = hivStatusMap[hiv.toLowerCase()]
  }
  if (reasons) {
    patientData.MMTestReason = reasons.join(',')
  }
  if (microscopy) {
    patientData.MicroscopyResult = microscopyMap[microscopy]
  }
  if (specimen) {
    patientData.SampleType = specimenMap[specimen]
  }

  return { patientData }
}

function getNextItem(vars, index) {
  if (index + 1 >= vars.length) {
    return { hasValue: false }
  }
  else {
    const newIndex = index + 1
    return { hasValue: true, lastIndex: newIndex, value: vars[newIndex] }
  }
}

function getNotesValues(notes) {
  const values = {}
  const vars = notes.split(',')
  let item = getNextItem(vars, -1)
  if (!item.hasValue) return values

  const ageValue = item.value
  if (ageValue.match(/^\d{1,2}$/)) {
    values.age = +ageValue
  }

  item = getNextItem(vars, item.lastIndex)
  if (!item.hasValue) return values

  const genderValue = item.value
  if (genderValue.match(/m|f/i)) {
    values.gender = genderValue.toLowerCase()
  }

  item = getNextItem(vars, item.lastIndex)
  if (!item.hasValue) return values

  const previousValue = item.value
  const previousValueMatch = previousValue.match(/.*(?<previous>yes|no|unk).*/i)
  if (previousValueMatch) {
    values.previous = previousValueMatch.groups.previous.toLowerCase()
  }

  item = getNextItem(vars, item.lastIndex)
  if (!item.hasValue) return values

  const hivValue = item.value
  if (hivValue.match(/.*(hiv\+|hiv-|hiv\?).*/i)) {
    values.hiv = hivValue.toLowerCase()
  }

  const reasons = []

  item = getNextItem(vars, item.lastIndex)
  while (item.hasValue) {

    const reasonMatch = item.value.match(/.*(?<reason>(dx|fu|mdr|dm|con|xray)).*/i)
    if (reasonMatch) {
      reasons.push(reasonMatch.groups.reason.toLowerCase())
    }
    else {
      if (reasons.length > 0) {
        values.reasons = reasons
        break
      }
    }
    item = getNextItem(vars, item.lastIndex)
  }

  if (!item.hasValue) return values

  const microscopyValue = item.value
  const microscopyMatch = microscopyValue.match(/.*(?<microscopy>(pos|neg|nd)).*/i)
  if (microscopyMatch) {
    values.microscopy = microscopyMatch.groups.microscopy.toLowerCase()
  }

  item = getNextItem(vars, item.lastIndex)
  if (!item.hasValue) return values

  const specimenValue = item.value
  const specimentMatch = specimenValue.match(/.*(?<specimen>(spu|csf|gl|ln|oth)).*/i)
  if (specimentMatch) {
    values.specimen = specimentMatch.groups.specimen.toLowerCase()
  }
  return values
}

const hivStatusMap = {
  'hiv+': 'Positive',
  'hiv-': 'Negative',
  'hiv?': 'HIV Unknown',
}

const microscopyMap = {
  pos: 'Smear Positive',
  neg: 'Smear Negative',
  nd: 'Not Done',
}

const genderMap = {
  m: 'M',
  f: 'F',
}

const specimenMap = {
  spu: 'Sputum',
  csf: 'CSF',
  gl: 'Gastric Lavage',
  ln: 'Lymph Node',
  oth: 'Other',
}

const previousMap = {
  yes: 'Previously Treated',
  no: 'No Previous Treatment',
  unk: 'Unknown',
}

module.exports = { parseNotes }
