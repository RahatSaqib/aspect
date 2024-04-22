const {
  admin,
  clinician,
  deviceMaker,
  donor,
  manager,
  ntp,
  resultViewerNo,
  resultViewerYes,
  technician,
  aspectBeta,
  mergeJobFunctions,
} = require('../../fixtures/jobFunctionBase')

const adminEnhanced = mergeJobFunctions(admin, {
  reports: [...admin.reports, 'genexpert_issues', 'device_summary_report', 'pk_missing_cartridges_report'],
})

const aspectBetaEnhanced = mergeJobFunctions(aspectBeta, {
  ...aspectBeta.permissions,
  permissions: [
    {
      module: 'dashboard-v2',
      activity: 'view',
    },
  ],
  reports: ['pk_xpert_site_summary_site_wise_report'],
})
module.exports = [
  adminEnhanced,
  clinician,
  deviceMaker,
  donor,
  manager,
  ntp,
  resultViewerNo,
  resultViewerYes,
  technician,
  aspectBetaEnhanced,
]
