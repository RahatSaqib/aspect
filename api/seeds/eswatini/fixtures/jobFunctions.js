const {
  admin,
  regionalOfficer,
  labUser,
  clinician,
  remoteHealthWorker,
  technician,
  countryReportsDecorator,
} = require('../../fixtures/jobFunctionBase')
const reports = require('./reports')

const countryReports = Object.values(reports).map(report => report.externalId)

module.exports = [
  countryReportsDecorator(admin, countryReports),
  countryReportsDecorator(regionalOfficer, countryReports),
  countryReportsDecorator(labUser, countryReports),
  countryReportsDecorator(clinician, countryReports),
  countryReportsDecorator(remoteHealthWorker, countryReports),
  countryReportsDecorator(technician, countryReports),
]
