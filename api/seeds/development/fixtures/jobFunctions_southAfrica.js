const { admin, labUser, regionalOfficer, mergeJobFunctions } = require('../../fixtures/jobFunctionBase')

module.exports = [
  mergeJobFunctions(admin, {
    permissions: [
      {
        module: 'device',
        activity: 'edit',
      },
      {
        module: 'result',
        activity: 'edit',
      },
      {
        module: 'site',
        activity: 'edit',
      },
      {
        module: 'browse',
        activity: 'view',
      },
    ],
  }),
  mergeJobFunctions(labUser, {
    permissions: [
      {
        module: 'result',
        activity: 'edit',
      },
      {
        module: 'browse',
        activity: 'view',
      },
      {
        module: 'device',
        activity: 'view',
      },
      {
        module: 'site',
        activity: 'view',
      },
      {
        module: 'task',
        activity: 'view',
      },
    ],
  }),
  mergeJobFunctions(regionalOfficer, {
    permissions: [
      {
        module: 'result',
        activity: 'edit',
      },
      {
        module: 'browse',
        activity: 'view',
      },
      {
        module: 'device',
        activity: 'view',
      },
      {
        module: 'site',
        activity: 'view',
      },
      {
        module: 'task',
        activity: 'view',
      },
    ],
  }),
]
