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
  reports: _.uniq([
    ...jobFunction.reports,
    'results_10a_10b_covid',
    'results_10a_10b_covid_ntp_use',
    'module_status_report',
  ]), // add externalId of report
})
const withNoReporterPermissions = jf => ({
  ...jf,
  permissions: _.filter(jf.permissions, permission => permission.module !== 'reporter'),
})
module.exports = [
  withNoReporterPermissions(withNewReports(admin)),
  withNoReporterPermissions(withNewReports(regionalOfficer)),
  withNoReporterPermissions(labUser),
  withNoReporterPermissions(clinician),
  withNoReporterPermissions(remoteHealthWorker),
  withNoReporterPermissions(technician),
]
