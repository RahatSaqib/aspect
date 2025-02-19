const {
  admin,
  clinician,
  labUser,
  regionalOfficer,
  technician,
  aspectBeta,
  mergeJobFunctions,
  manager,
} = require('../../fixtures/jobFunctionBase')

module.exports = [
  admin,
  manager,
  regionalOfficer,
  mergeJobFunctions(labUser, {
    permissions: [
      {
        module: 'inventory',
        activity: 'edit',
      },
    ],
  }),
  clinician,
  technician,
  aspectBeta,
]
