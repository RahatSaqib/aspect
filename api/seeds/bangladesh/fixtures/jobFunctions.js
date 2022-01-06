const _ = require('lodash')
const {
  admin,
  regionalOfficer,
  labUser,
  clinician,
  remoteHealthWorker,
  technician,
} = require('../../fixtures/jobFunctionBase')

const withNewReports = jobFunction => ({
  ...jobFunction,
  reports: _.uniq([...jobFunction.reports, 'results_dr_tb_10a']),
})

module.exports = [
  withNewReports(admin),
  withNewReports(regionalOfficer),
  labUser,
  clinician,
  remoteHealthWorker,
  technician,
]
