const {
  superAdmin,
  regionalOfficer,
  labUser,
  clinician,
  remoteHealthWorker,
  technician,
  countryReportsDecorator,
  aspectBeta,
  regionalAdmin,
  inventoryManager,
} = require('../../fixtures/jobFunctionBase')
const reports = require('./reports')

const countryReports = Object.values(reports).map(report => report.externalId)

module.exports = [
  countryReportsDecorator(superAdmin, countryReports),
  countryReportsDecorator(regionalAdmin, countryReports),
  countryReportsDecorator(regionalOfficer, countryReports),
  countryReportsDecorator(labUser, countryReports),
  countryReportsDecorator(clinician, countryReports),
  countryReportsDecorator(remoteHealthWorker, countryReports),
  countryReportsDecorator(technician, countryReports),
  aspectBeta,
  inventoryManager,
]
