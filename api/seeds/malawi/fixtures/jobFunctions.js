const {
  admin,
  clinician,
  labUser,
  regionalOfficer,
  technician,
  aspectBeta,
  mergeJobFunctions,
} = require('../../fixtures/jobFunctionBase')

module.exports = [
  admin,
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
