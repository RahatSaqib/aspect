const {
  admin,
  regionalOfficer,
  labUser,
  clinician,
  remoteHealthWorker,
  technician,
} = require('../../fixtures/jobFunctionBase')

module.exports = [
  {
    ...admin,
    reports: [...admin.reports, 'xpert_test_activities_report'],
  },
  {
    ...regionalOfficer,
    reports: [...regionalOfficer.reports, 'xpert_test_activities_report'],
  },
  {
    ...labUser,
    reports: [...labUser.reports, 'xpert_test_activities_report'],
  },
  {
    ...clinician,
    reports: [...clinician.reports, 'xpert_test_activities_report'],
  },
  {
    ...remoteHealthWorker,
    reports: [...remoteHealthWorker.reports, 'xpert_test_activities_report'],
  },
  {
    ...technician,
    reports: [...technician.reports, 'xpert_test_activities_report'],
  },
  technician,
]
