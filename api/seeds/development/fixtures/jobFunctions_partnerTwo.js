const { labManager, mergeJobFunctions } = require('../../fixtures/jobFunctionBase')

module.exports = [
  mergeJobFunctions(labManager, {
    permissions: [
      {
        module: 'dashboard',
        activity: 'device',
      },
      {
        module: 'account',
        activity: 'edit',
      },
      {
        module: 'case',
        activity: 'edit',
      },
      {
        module: 'device',
        activity: 'edit',
      },
      {
        module: 'site',
        activity: 'edit',
      },
      {
        module: 'treatmentStatus',
        activity: 'edit',
      },
      {
        module: 'dashboard',
        activity: 'inventory',
      },
      {
        module: 'dashboard',
        activity: 'report',
      },
      {
        module: 'dashboard',
        activity: 'result',
      },
      {
        module: 'dashboard',
        activity: 'site',
      },
      {
        module: 'dashboard',
        activity: 'summary',
      },
      {
        module: 'dashboard',
        activity: 'target',
      },
      {
        module: 'assay',
        activity: 'view',
      },
      {
        module: 'inventory',
        activity: 'view',
      },
      {
        module: 'person',
        activity: 'view',
      },
      {
        module: 'router',
        activity: 'view',
      },
    ],
  }),
]
