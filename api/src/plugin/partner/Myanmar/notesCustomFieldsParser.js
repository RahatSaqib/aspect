const startOfRegex = /^\s*/
const separator = /(?:\s?,\s?)?/

// Ad-hoc parser for legacy custom fields in Myanmar using 'result.notes' field.
// see: https://github.com/SystemOneId/GxAlert/blob/b3c327a9199cfb1985750a53cd326706ece74253/Utilities/Parsing.cs#L936
// for the original implementation in GxAlert and https://github.com/SystemOneId/aspect/commit/4cfe1068154618ac9597b2d7ab4de07cb63182dd
// for the original implementation in Aspect (never released to production).
function parseNotes(notes) {
  const expression = [
    startOfRegex,
    /(?<age>\d{1,2})?/,
    /(?<gender>m|f)?/,
    /(?<previous>yes|no|unk)?/,
    /(?<hiv>hiv\+|hiv-|hiv\?)?/,
    /(?<reason>dx|fu|mdr|dm|con|xray)?/,
    /(?<reason2>dx|fu|mdr|dm|con|xray)?/,
    /(?:dx|fu|mdr|dm|con|xray)?/, // discard eventually more reason
    /(?<microscopy>pos|neg|nd)?/,
    /(?<specimen>spu|csf|gl|ln|oth)?/,
  ]
    .map(r => r.source)
    .join(separator.source)

  const rexp = new RegExp(expression, 'gi')

  const match = rexp.exec(notes)

  if (!match) {
    return {}
  }

  const patientData = {}

  const { age, gender, previous, hiv, reason, microscopy, specimen } = match.groups

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
    patientData.HivStatus = hivStatusMap[hiv]
  }
  if (reason) {
    // concatenate reason and reason2 with a comma if there are 2 reasons
    if (match.groups.reason2) {
      patientData.MMTestReason = `${reason},${match.groups.reason2}`.toLocaleLowerCase() // TODO: Map to MMTestReason Custom field.
    } else {
      patientData.MMTestReason = reason.toLocaleLowerCase() // TODO: Map to MMTestReason Custom field.
    }
  }
  if (microscopy) {
    patientData.MicroscopyResult = microscopyMap[microscopy]
  }
  if (specimen) {
    patientData.SampleType = specimenMap[specimen]
  }

  return { patientData }
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
