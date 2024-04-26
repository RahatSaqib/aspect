const { labManager, mergeJobFunctions } = require('../../fixtures/jobFunctionBase')

module.exports = [
  mergeJobFunctions(labManager, {
    permissions: [
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
        activity: 'summary',
      },
      {
        module: 'assay',
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
