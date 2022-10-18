const _ = require('lodash')

function getRandomGeneXpertPatientData(patientNumber, patientData) {
  const tbPatientData = _.sample(patientData)
  tbPatientData.hivStatus = _.sample(['HIV Positive', 'HIV Negative', 'HIV Unknown', null])
  return tbPatientData
}

function getRandomTruenatPatientData(patientNumber, patientData) {
  const tbPatientData = _.sample(patientData)
  return {
    id: tbPatientData.id,
    age: parseInt(tbPatientData.age, 10),
    gender: tbPatientData.gender,
    doctorName: tbPatientData.requestorName || '',
    patientName: tbPatientData.name,
  }
}

module.exports = {
  getRandomGeneXpertPatientData,
  getRandomTruenatPatientData,
}
