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
    reports: [
      ...admin.reports,
      'xpert_test_activities_report',
      'xpert_m4b1_patients',
    ],
  },
  {
    ...regionalOfficer,
    reports: [
      ...regionalOfficer.reports,
      'xpert_test_activities_report',
      'xpert_m4b1_patients',
    ],
  },
  {
    ...labUser,
    reports: [
      ...labUser.reports,
      'xpert_test_activities_report',
      'xpert_m4b1_patients',
    ],
  },
  {
    ...clinician,
    reports: [
      ...clinician.reports,
      'xpert_test_activities_report',
      'xpert_m4b1_patients',
    ],
  },
  {
    ...remoteHealthWorker,
    reports: [
      ...remoteHealthWorker.reports,
      'xpert_test_activities_report',
      'xpert_m4b1_patients',
    ],
  },
  {
    ...technician,
    reports: [
      ...technician.reports,
      'xpert_test_activities_report',
      'xpert_m4b1_patients',
    ],
  },
]
