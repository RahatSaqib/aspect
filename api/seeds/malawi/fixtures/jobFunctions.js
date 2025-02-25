const {
  superAdmin,
  clinician,
  labUser,
  regionalOfficer,
  technician,
  aspectBeta,
  mergeJobFunctions,
  regionalAdmin,
} = require('../../fixtures/jobFunctionBase')

module.exports = [
  superAdmin,
  regionalAdmin,
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
