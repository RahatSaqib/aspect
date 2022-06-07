const {
  admin,
  clinician,
  labUser,
  regionalOfficer,
  mergeJobFunctions,
  technician,
} = require('../../fixtures/jobFunctionBase')

module.exports = [
  mergeJobFunctions(admin, {
    permissions: [],
  }),
  mergeJobFunctions(regionalOfficer, {
    permissions: [],
  }),
  mergeJobFunctions(labUser, {
    permissions: [
      {
        module: 'inventory',
        activity: 'edit',
      },
    ],
  }),
  mergeJobFunctions(clinician, {
    permissions: [],
  }),
  technician,
]
