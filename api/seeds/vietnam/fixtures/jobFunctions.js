const {
  admin,
  regionalOfficer,
  labUser,
  clinician,
  remoteHealthWorker,
  technician,
} = require('../../fixtures/jobFunctionBase')

const countryReports = [
  'xpert_test_activities_report',
  'result_counts_by_hiv_status',
  'xpert_m4b1_patients',
]

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
