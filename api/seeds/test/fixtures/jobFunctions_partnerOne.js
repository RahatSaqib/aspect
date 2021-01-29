const {
  admin,
  regionalOfficer,
  labUser,
  clinician,
} = require('../../fixtures/jobFunctionBase')

module.exports = [
  admin,
  regionalOfficer,
  labUser,
  clinician,
  {
    name: 'Manager',
    permissions: [
      {
        module: 'treatmentStatus',
        activity: 'edit',
      },
      {
        module: 'site',
        activity: 'edit',
      },
      {
        module: 'device',
        activity: 'edit',
      },
      {
        module: 'assay',
        activity: 'edit',
      },
      {
        module: 'inventory',
        activity: 'edit',
      },
      {
        module: 'reporter',
        activity: 'edit',
      },
    ],
  },
]
