const _ = require('lodash')

// FixMe - Confirm which object contains PersonName
const values = {
  PersonName: ['person', 'name'],
  SiteState: ['site', 'state'],
  SiteCountry: ['site', 'country'],
  DeviceName: ['device', 'name'],
  DeviceShortName: ['device', 'shortname'],
  TestEndedOn: ['result', 'endedOn'],
  PatientId: ['result', 'patientId'],
  SampleId: ['result', 'sampleId'],
  AssayName: ['result', 'assayName'],
  ModuleSerial: ['result', 'moduleSerial'],
  ResultCategory1: ['result', 'resultCategory1Name'],
  ResultCategory2: ['result', 'resultCategory2Name'],
  ErrorCode: ['result', 'errorCode'],
}

// Expects an input string and an object containing the other objects
const process = function(inputString, inputObject) {
  _.forEach(values, (value, key) => {
    if (Object.prototype.hasOwnProperty.call(inputObject, value[0])) {
      const actualValue = inputObject[`${value[0]}`][`${value[1]}`]
      if (actualValue)
        inputString = inputString.replace(`[${key}]`, actualValue)
    }
  })
  return inputString
}

module.exports = {
  process,
}
