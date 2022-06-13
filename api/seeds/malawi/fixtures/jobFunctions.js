const {
  admin,
  clinician,
  labUser,
  regionalOfficer,
  mergeJobFunctions,
  technician,
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
]
