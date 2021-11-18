const _ = require('lodash')

function getRandomGeneXpertPatientData(patientNumber, patientData) {
  const tbPatientData = patientData[_.random(patientNumber)]
  tbPatientData.hivStatus = _.sample([
    'HIV Positive',
    'HIV Negative',
    'HIV Unknown',
    null,
  ])
  return tbPatientData
}

function getRandomTruenatPatientData(patientNumber, patientData) {
  const tbPatientData = patientData[_.random(patientNumber)]
  return {
    id: tbPatientData.id,
    age: parseInt(tbPatientData.age, 10),
    gender: tbPatientData.gender,
    doctorName: '',
    patientName: tbPatientData.name,
  }
}

module.exports = {
  getRandomGeneXpertPatientData,
  getRandomTruenatPatientData,
}
