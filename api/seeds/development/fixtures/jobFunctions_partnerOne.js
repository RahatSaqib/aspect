const _ = require('lodash')
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
} = require('../../fixtures/jobFunctionBase')

const withNewReports = jobFunction => ({
  ...jobFunction,
  reports: _.uniq([...jobFunction.reports, 'results_dr_tb_10a']),
})

module.exports = [
  withNewReports(admin),
  clinician,
  deviceMaker,
  donor,
  withNewReports(manager),
  withNewReports(ntp),
  resultViewerNo,
  resultViewerYes,
  technician,
]
