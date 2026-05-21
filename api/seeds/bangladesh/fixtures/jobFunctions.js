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
  reports: _.uniq([
    ...jobFunction.reports,
    'results_10a_10b_covid',
    'results_10a_10b_covid_ntp_use',
    'results_ntp_use',
    'module_status_report',
  ]), // add externalId of report
})
const withNoReporterPermissions = jf => ({
  ...jf,
  permissions: _.filter(jf.permissions, permission => permission.module !== 'reporter'),
})
const withFormsPermission = jf => {
  const hasResultPermission = _.some(jf.permissions, permission => permission.module === 'result')
  if (!hasResultPermission) return jf

  return {
    ...jf,
    permissions: _.uniqWith([...jf.permissions, { module: 'forms', activity: 'view' }], _.isEqual),
  }
}

module.exports = [
  withFormsPermission(withNoReporterPermissions(withNewReports(superAdmin))),
  withFormsPermission(withNoReporterPermissions(withNewReports(regionalAdmin))),
  withFormsPermission(withNoReporterPermissions(withNewReports(regionalOfficer))),
  withFormsPermission(withNoReporterPermissions(labUser)),
  withFormsPermission(withNoReporterPermissions(clinician)),
  withNoReporterPermissions(remoteHealthWorker),
  withNoReporterPermissions(technician),
  aspectBeta,
  inventoryManager,
]
