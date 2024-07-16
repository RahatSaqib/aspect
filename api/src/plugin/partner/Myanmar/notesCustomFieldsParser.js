const startOfRegex = /^\s*/
const separator = /(?:\s?,\s?)?/

function parseNotes(notes) {
  const expression = [
    startOfRegex,
    /(?<age>\d{1,2})?/,
    /(?<gender>m|f)?/,
    /(?<previous>yes|no|unk)?/,
    /(?<hiv>hiv\+|hiv\-|hiv?)?/,
    /(?<reason>dx|fu|mdr|dm|con|xray)?/,
    /(?<microscope>pos|neg|nd)?/,
    /(?<specimen>spu|csf|gl|ln|oth)?/,
  ].map((r) => r.source)
    .join(separator.source)

  const rexp = new RegExp(expression, "gi")

  const match = rexp.exec(notes)

  if (!match) {
    return {}
  }

  const patientData = {}

  const { age, gender, previous, hiv, reason, microscope, specimen } = match.groups

  if (age) {
    patientData.PatientAge = age
  }
  if (gender) {
    patientData.PatientGender = genderMap[gender]
  }
  if (previous) {
    patientData.PreviousTreatmentHistory = previousMap[previous]
  }
  if (hiv) {
    patientData.hivStatus = hivStatusMap[hiv]
  }
  if (reason) {
    patientData.MMTestReason = reason.toLocaleLowerCase() // TODO: Map to MMTestReason Custom field.
  }
  if (microscope) {
    patientData.MicroscopyResult = microscopeMap[microscope]
  }
  if (specimen) {
    patientData.SampleType = specimenMap[specimen]
  }

  return { patientData }
}

hivStatusMap = {
  'hiv+': 'Positive',
  'hiv-': 'Negative',
  'hiv?': 'HIV Unknown',
}

microscopeMap = {
  pos: 'Smear Positive',
  neg: 'Smear Negative',
  nd: 'Not Done',
}

genderMap = {
  m: 'M',
  f: 'F',
}

specimenMap = {
  spu: 'Sputum',
  csf: 'CSF',
  gl: 'Gastric Lavage',
  ln: 'Lymph Node',
  oth: 'Other',
}

previousMap = {
  yes: 'Previously Treated',
  no: 'No Previous Treatment',
  unk: 'Unknown',
}

module.exports = { parseNotes }