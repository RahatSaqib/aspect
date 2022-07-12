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

const adminEnhaced = mergeJobFunctions(admin, {
  reports: [...admin.reports, 'genexpert_issues'],
})
module.exports = [
  adminEnhaced,
  clinician,
  deviceMaker,
  donor,
  manager,
  ntp,
  resultViewerNo,
  resultViewerYes,
  technician,
]
