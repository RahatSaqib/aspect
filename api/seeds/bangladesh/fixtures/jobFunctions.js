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
  ]), // add externalId of report
})

module.exports = [
  withNewReports(admin),
  withNewReports(regionalOfficer),
  labUser,
  clinician,
  remoteHealthWorker,
  technician,
]
