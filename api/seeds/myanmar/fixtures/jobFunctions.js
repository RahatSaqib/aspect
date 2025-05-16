const _ = require('lodash')
const {
  superAdmin,
  regionalOfficer,
  labUser,
  clinician,
  remoteHealthWorker,
  technician,
  aspectBeta,
  regionalAdmin,
  inventoryManager,
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
  withNoReporterPermissions(withNewReports(superAdmin)),
  withNoReporterPermissions(withNewReports(regionalAdmin)),
  withNoReporterPermissions(withNewReports(regionalOfficer)),
  withNoReporterPermissions(labUser),
  withNoReporterPermissions(clinician),
  withNoReporterPermissions(remoteHealthWorker),
  withNoReporterPermissions(technician),
  aspectBeta,
  inventoryManager,
]
