const _ = require('lodash')
const {
  admin,
  regionalOfficer,
  labUser,
  clinician,
  remoteHealthWorker,
  technician,
  aspectBeta,
  manager,
} = require('../../fixtures/jobFunctionBase')

const withNewReports = jobFunction => ({
  ...jobFunction,
  reports: _.uniq([...jobFunction.reports, 'quarterly_report']), // add externalId of report
})
const withNoReporterPermissions = jf => ({
  ...jf,
  permissions: _.filter(jf.permissions, permission => permission.module !== 'reporter'),
})

module.exports = [
  withNoReporterPermissions(withNewReports(admin)),
  withNoReporterPermissions(withNewReports(manager)),
  withNoReporterPermissions(withNewReports(regionalOfficer)),
  withNoReporterPermissions(labUser),
  withNoReporterPermissions(clinician),
  withNoReporterPermissions(remoteHealthWorker),
  withNoReporterPermissions(technician),
  aspectBeta,
]
