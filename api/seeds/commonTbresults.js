const _ = require('lodash')

function getRandomTBPatientData(patientNumber, patientData) {
  const tBpatientData = patientData[_.random(patientNumber)]
  tBpatientData.hivStatus = _.sample([
    'HIV positive',
    'HIV negative',
    'HIV unknow',
    null,
  ])
  return tBpatientData
}

module.exports = {
  getRandomTBPatientData,
}
