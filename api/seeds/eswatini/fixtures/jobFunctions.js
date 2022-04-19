const {
  admin,
  regionalOfficer,
  labUser,
  clinician,
  remoteHealthWorker,
  technician,
  decorateJobFunction,
} = require('../../fixtures/jobFunctionBase')
const reports = require('./reports')

const countryReports = Object.values(reports).map(report => report.externalId)

module.exports = [
  decorateJobFunction(admin, countryReports),
  decorateJobFunction(regionalOfficer, countryReports),
  decorateJobFunction(labUser, countryReports),
  decorateJobFunction(clinician, countryReports),
  decorateJobFunction(remoteHealthWorker, countryReports),
  decorateJobFunction(technician, countryReports),
]
