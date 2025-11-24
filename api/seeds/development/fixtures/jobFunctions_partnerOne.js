const {
  superAdmin,
  clinician,
  deviceMaker,
  donor,
  regionalAdmin,
  ntp,
  resultViewerNo,
  resultViewerYes,
  technician,
  aspectBeta,
  inventoryManager,
  mergeJobFunctions,
} = require('../../fixtures/jobFunctionBase')

const adminEnhanced = mergeJobFunctions(superAdmin, {
  permissions: [...superAdmin.permissions, ...aspectBeta.permissions],
  reports: [...superAdmin.reports, 'genexpert_issues', 'device_summary_report', 'unreconciled_inventory_report'],
})

const aspectBetaEnhanced = mergeJobFunctions(aspectBeta, {
  permissions: [
    ...aspectBeta.permissions,
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
  regionalAdmin,
  ntp,
  resultViewerNo,
  resultViewerYes,
  technician,
  aspectBetaEnhanced,
  inventoryManager,
]
