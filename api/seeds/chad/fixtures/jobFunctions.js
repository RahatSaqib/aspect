const _ = require('lodash')
const {
  superAdmin,
  regionalAdmin,
  regionalOfficer,
  labUser,
  clinician,
  technician,
  aspectBeta,
  inventoryManager,
} = require('../../fixtures/jobFunctionBase')

const withChadEidReport = jobFunction => ({
  ...jobFunction,
  reports: _.uniq([...jobFunction.reports, 'eid_monthly_report']),
})

module.exports = [
  withChadEidReport(superAdmin),
  withChadEidReport(regionalAdmin),
  withChadEidReport(regionalOfficer),
  withChadEidReport(labUser),
  withChadEidReport(clinician),
  withChadEidReport(technician),
  aspectBeta,
  inventoryManager,
]
