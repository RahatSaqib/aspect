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
  reports: [...admin.reports, 'genexpert_issues', 'device_summary_report'],
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
]
