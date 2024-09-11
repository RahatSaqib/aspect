const _ = require('lodash')

// Ad-hoc parser for legacy custom fields in Myanmar using 'result.notes' field.
// see: https://github.com/SystemOneId/GxAlert/blob/b3c327a9199cfb1985750a53cd326706ece74253/Utilities/Parsing.cs#L936
// for the original implementation in GxAlert and https://github.com/SystemOneId/aspect/commit/4cfe1068154618ac9597b2d7ab4de07cb63182dd
// for the original implementation in Aspect (never released to production).
function parseNotes(notes) {
  const patientData = {}

  if (!_.isString(notes)) {
    return { patientData }
  }

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

function getNotesValues(notes) {
  const regexs = [
    { key: 'age', expression: /^\d{1,2}/, transformation: v => +v },
    { key: 'gender', expression: /m|f|male|female/i },
    { key: 'previous', expression: /yes|no|unk/i },
    { key: 'hiv', expression: /hiv\+|hiv-|hiv\?/i },
    {
      key: 'reasons',
      expression: /dx|fu|mdr|dm|con|xray(?=[^,]*$)/i,
      repetable: true,
    },
    { key: 'microscopy', expression: /pos|neg|nd/i },
    { key: 'specimen', expression: /spu|csf|gl|ln|oth/i },
  ]

  const acc = { text: notes, cur: {} }
  let i = 0
  while (i < regexs.length) {
    const def = regexs[i]
    const transform = def.transformation ?? (v => v)
    while (acc.text.match(/^[/,|]/)) {
      acc.text = acc.text.slice(1)
    }
    const match = def.repetable ? acc.text.split(/[/,|]/)[0].match(def.expression) : acc.text.match(def.expression)
    if (match) {
      acc.text = acc.text.substring(match.index + match[0].length)
      const value = transform(match[0].toLowerCase())
      if (def.repetable) {
        acc.cur[def.key] = acc.cur[def.key] || []
        acc.cur[def.key].push(value)
      } else {
        acc.cur[def.key] = value
        i += 1
      }
    } else {
      if (!def.repetable) {
        acc.text = trimToSplitter(acc.text)
      }
      i += 1
    }
  }
  return acc.cur
}

function trimToSplitter(text) {
  const split = text.split(',')
  if (split.length > 1) {
    return split.slice(1).join(',')
  }
  return text
}
const hivStatusMap = {
  'hiv+': 'Positive',
  'hiv-': 'Negative',
  'hiv?': 'Unknown',
}

const microscopyMap = {
  pos: 'Smear Positive',
  neg: 'Smear Negative',
  nd: 'Not Done',
}
const genderMap = {
  m: 'Male',
  f: 'Female',
  male: 'Male',
  female: 'Female',
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

module.exports = { parseNotes, genderMap }
