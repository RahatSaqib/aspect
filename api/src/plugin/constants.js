const GENDER_MAP = {
  m: 'Male',
  f: 'Female',
  male: 'Male',
  female: 'Female',
}
const HIV_STATUS_MAP = {
  'hiv+': 'Positive',
  'hiv-': 'Negative',
  'hiv?': 'Unknown',
}

const MICROSCOPY_MAP = {
  pos: 'Smear Positive',
  neg: 'Smear Negative',
  nd: 'Not Done',
}

const SPECIMEN_MAP = {
  spu: 'Sputum',
  csf: 'CSF',
  gl: 'Gastric Lavage',
  ln: 'Lymph Node',
  oth: 'Other',
}

const PREVIOUS_MAP = {
  yes: 'Previously Treated',
  no: 'No Previous Treatment',
  unk: 'Unknown',
}

module.exports = {
  GENDER_MAP,
  PREVIOUS_MAP,
  SPECIMEN_MAP,
  MICROSCOPY_MAP,
  HIV_STATUS_MAP,
}
