const _ = require('lodash')
const {integer} = require("twilio/lib/base/deserialize");

function getRandomGeneXpertPatientData(patientNumber, patientData) {
  const tbPatientData = patientData[_.random(patientNumber)]
  tbPatientData.hivStatus = _.sample([
    'HIV positive',
    'HIV negative',
    'HIV unknow',
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
