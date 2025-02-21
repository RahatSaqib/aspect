const {
  superAdmin,
  regionalOfficer,
  labUser,
  clinician,
  remoteHealthWorker,
  technician,
  aspectBeta,
  regionalAdmin,
} = require('../../fixtures/jobFunctionBase')
const reports = require('./reports')

const countryReports = Object.values(reports).map(report => report.externalId)

module.exports = [
  {
    ...superAdmin,
    reports: [...superAdmin.reports, ...countryReports],
  },
  {
    ...regionalAdmin,
    reports: [...regionalAdmin.reports, ...countryReports],
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
  {
    ...aspectBeta,
    reports: [...aspectBeta.reports, ...countryReports],
  },
]
