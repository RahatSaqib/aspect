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
  mergeJobFunctions,
} = require('../../fixtures/jobFunctionBase')

const adminEnhanced = mergeJobFunctions(admin, {
  reports: [...admin.reports, 'genexpert_issues', 'device_summary_report', 'pk_missing_cartridges_report'],
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
  {
    name: 'Pakistan Testing',
    permissions: [
      {
        module: 'dashboard-v2',
        activity: 'view',
      },
      {
        module: 'supplies',
        activity: 'view',
      },
    ],
    reports: ['pk_xpert_site_summary_site_wise_report'],
  },
]
