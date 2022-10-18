const {
  admin,
  regionalOfficer,
  labUser,
  clinician,
  remoteHealthWorker,
  technician,
} = require('../../fixtures/jobFunctionBase')
const reports = require('./reports')

const countryReports = Object.values(reports).map(report => report.externalId)

module.exports = [
  {
    ...admin,
    reports: [...admin.reports, ...countryReports],
  },
  {
    ...regionalOfficer,
    reports: [...regionalOfficer.reports, ...countryReports],
  },
  {
    ...labUser,
    reports: [...labUser.reports, ...countryReports],
  },
  {
    ...clinician,
    reports: [...clinician.reports, ...countryReports],
  },
  {
    ...remoteHealthWorker,
    reports: [...remoteHealthWorker.reports, ...countryReports],
  },
  {
    ...technician,
    reports: [...technician.reports, ...countryReports],
  },
]
